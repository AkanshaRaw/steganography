from flask import Flask, render_template, request, send_file, jsonify
from PIL import Image
import os
from io import BytesIO

app = Flask(__name__)

# ---------- Encoding Logic ----------
def encode_message(img, message):
    message += chr(0)  # End-of-text marker
    binary_msg = ''.join(f"{ord(c):08b}" for c in message)
    msg_len = len(binary_msg)

    if img.mode != 'RGB':
        img = img.convert('RGB')

    pixels = list(img.getdata())
    encoded_pixels = []
    msg_index = 0

    for pixel in pixels:
        r, g, b = pixel
        if msg_index < msg_len:
            r = (r & ~1) | int(binary_msg[msg_index])
            msg_index += 1
        if msg_index < msg_len:
            g = (g & ~1) | int(binary_msg[msg_index])
            msg_index += 1
        if msg_index < msg_len:
            b = (b & ~1) | int(binary_msg[msg_index])
            msg_index += 1
        encoded_pixels.append((r, g, b))

    if msg_index < msg_len:
        raise ValueError("Message is too long for this image.")

    img.putdata(encoded_pixels)
    return img

# ---------- Decoding Logic ----------
def decode_message(img):
    if img.mode != 'RGB':
        img = img.convert('RGB')

    pixels = list(img.getdata())
    bits = ''

    for pixel in pixels:
        for value in pixel:
            bits += str(value & 1)

    chars = []
    for i in range(0, len(bits), 8):
        byte = bits[i:i+8]
        char = chr(int(byte, 2))
        if char == chr(0):
            break
        chars.append(char)

    return ''.join(chars)

# ---------- Flask Routes ----------
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/encode', methods=['POST'])
def encode():
    if 'image' not in request.files or 'message' not in request.form:
        return jsonify({'error': 'Image or message not found'}), 400

    image = request.files['image']
    message = request.form['message']
    
    img = Image.open(image)
    try:
        encoded_img = encode_message(img, message)

        # Save encoded image in memory
        img_io = BytesIO()
        encoded_img.save(img_io, 'PNG')
        img_io.seek(0)

        return send_file(img_io, mimetype='image/png', as_attachment=True, download_name='encoded_image.png')
    except ValueError as e:
        return jsonify({'error': str(e)}), 400

@app.route('/decode', methods=['POST'])
def decode():
    if 'image' not in request.files:
        return jsonify({'error': 'Image not found'}), 400

    image = request.files['image']
    img = Image.open(image)
    hidden_message = decode_message(img)

    return jsonify({'message': hidden_message})

if __name__ == '__main__':
    app.run(debug=True)
