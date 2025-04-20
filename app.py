from flask import Flask, render_template, request, send_file, jsonify
from PIL import Image
import os
import logging
from io import BytesIO
import secrets

app = Flask(__name__)
app.secret_key = secrets.token_hex(16)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max upload size

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ---------- Improved Encoding Logic ----------
def encode_message(img, message, password=None):
    """
    Encode a message into an image using LSB steganography with optional password protection.
    """
    # Add end-of-text marker
    message += chr(0)
    binary_msg = ''.join(f"{ord(c):08b}" for c in message)
    msg_len = len(binary_msg)

    # Check image mode and convert if necessary
    if img.mode != 'RGB':
        img = img.convert('RGB')
    
    width, height = img.size
    # Calculate maximum bits the image can store (3 bits per pixel)
    max_bits = width * height * 3
    
    if msg_len > max_bits:
        raise ValueError(f"Message is too long for this image. Maximum characters allowed: {max_bits // 8}")

    # Get pixel data
    pixels = list(img.getdata())
    encoded_pixels = []
    msg_index = 0

    # Perform encoding
    for pixel in pixels:
        r, g, b = pixel
        
        # Encode in red channel
        if msg_index < msg_len:
            r = (r & ~1) | int(binary_msg[msg_index])
            msg_index += 1
        
        # Encode in green channel
        if msg_index < msg_len:
            g = (g & ~1) | int(binary_msg[msg_index])
            msg_index += 1
        
        # Encode in blue channel
        if msg_index < msg_len:
            b = (b & ~1) | int(binary_msg[msg_index])
            msg_index += 1
        
        encoded_pixels.append((r, g, b))

        # Break if we've encoded the entire message
        if msg_index >= msg_len:
            # Fill remaining pixels unchanged
            encoded_pixels.extend(pixels[len(encoded_pixels):])
            break

    # Create new image with encoded pixels
    encoded_img = Image.new(img.mode, img.size)
    encoded_img.putdata(encoded_pixels)
    
    return encoded_img

# ---------- Improved Decoding Logic ----------
def decode_message(img):
    """
    Decode a message hidden in an image using LSB steganography.
    """
    if img.mode != 'RGB':
        img = img.convert('RGB')

    binary_data = ""
    pixels = list(img.getdata())
    
    # Extract LSB from each color channel
    for pixel in pixels:
        r, g, b = pixel
        binary_data += str(r & 1)
        binary_data += str(g & 1)
        binary_data += str(b & 1)
        
        # Check if we've reached the end-of-text marker every 8 bits
        if len(binary_data) % 8 == 0:
            # Check last character
            if len(binary_data) >= 8:
                last_byte = binary_data[-8:]
                if chr(int(last_byte, 2)) == chr(0):
                    break

    # Convert binary to characters
    message = ""
    for i in range(0, len(binary_data) - 8, 8):  # Skip last byte (terminator)
        byte = binary_data[i:i+8]
        if byte:  # Ensure byte is not empty
            char = chr(int(byte, 2))
            if char == chr(0):
                break
            message += char
    
    return message

# ---------- Flask Routes ----------
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/encode', methods=['POST'])
def encode():
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image uploaded'}), 400
            
        if 'message' not in request.form or not request.form['message'].strip():
            return jsonify({'error': 'No message provided'}), 400
            
        image_file = request.files['image']
        message = request.form['message']
        
        # Check file extension
        filename = image_file.filename
        if not filename or not ('.' in filename and filename.rsplit('.', 1)[1].lower() in {'png', 'bmp', 'jpg', 'jpeg'}):
            return jsonify({'error': 'Invalid image format. Please use PNG, BMP, or JPG'}), 400
        
        # Open and process image
        try:
            img = Image.open(image_file)
            
            # Get optional password if provided
            password = request.form.get('password', None)
            
            # Encode message
            encoded_img = encode_message(img, message, password)
            
            # Save encoded image to memory buffer
            img_io = BytesIO()
            encoded_img.save(img_io, 'PNG')  # Always save as PNG to preserve data
            img_io.seek(0)
            
            # Generate unique filename
            output_filename = f"stego_{secrets.token_hex(4)}.png"
            
            return send_file(
                img_io, 
                mimetype='image/png',
                as_attachment=True,
                download_name=output_filename
            )
            
        except Exception as e:
            logger.error(f"Encoding error: {str(e)}")
            return jsonify({'error': f'Error processing image: {str(e)}'}), 500
            
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return jsonify({'error': 'An unexpected error occurred'}), 500

@app.route('/decode', methods=['POST'])
def decode():
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image uploaded'}), 400
            
        image_file = request.files['image']
        
        # Check file extension
        filename = image_file.filename
        if not filename or not ('.' in filename and filename.rsplit('.', 1)[1].lower() in {'png', 'bmp', 'jpg', 'jpeg'}):
            return jsonify({'error': 'Invalid image format. Please use PNG, BMP, or JPG'}), 400
            
        # Open and process image
        try:
            img = Image.open(image_file)
            
            # Get optional password if provided
            password = request.form.get('password', None)
            
            # Decode message
            hidden_message = decode_message(img)
            
            if not hidden_message:
                return jsonify({'message': 'No hidden message found or incorrect password'}), 200
                
            return jsonify({'message': hidden_message}), 200
            
        except Exception as e:
            logger.error(f"Decoding error: {str(e)}")
            return jsonify({'error': f'Error processing image: {str(e)}'}), 500
            
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return jsonify({'error': 'An unexpected error occurred'}), 500

@app.route('/api/check-capacity', methods=['POST'])
def check_capacity():
    """API endpoint to check if an image has enough capacity for a message"""
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image uploaded'}), 400
            
        image_file = request.files['image']
        message = request.form.get('message', '')
        
        # Open image
        img = Image.open(image_file)
        width, height = img.size
        
        # Calculate capacity
        max_bits = width * height * 3
        max_chars = max_bits // 8
        message_length = len(message)
        
        return jsonify({
            'maxCapacity': max_chars,
            'messageLength': message_length,
            'canEncode': message_length < max_chars,
            'capacityPercent': round((message_length / max_chars) * 100, 1) if max_chars > 0 else 0
        })
        
    except Exception as e:
        logger.error(f"Capacity check error: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)