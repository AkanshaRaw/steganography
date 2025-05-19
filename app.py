import os
import logging
from flask import Flask, render_template, request, jsonify, send_file, redirect, url_for, flash
import io
import base64
from werkzeug.utils import secure_filename
from steganography.image_steg import ImageSteganography
from steganography.audio_steg import AudioSteganography

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Create Flask app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "dev-secret-key")
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max upload size

# Initialize steganography objects
image_steg = ImageSteganography()
audio_steg = AudioSteganography()

# Routes
@app.route('/')
def home():
    return render_template('home.html')

@app.route('/image')
def index():
    return render_template('image.html')

@app.route('/audio')
def audio():
    return render_template('audio.html')

# Image steganography endpoints
@app.route('/encode', methods=['POST'])
def encode_image():
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image provided'}), 400
        
        image_file = request.files['image']
        message = request.form.get('message', '')
        password = request.form.get('password', None)
        
        if not image_file or not message:
            return jsonify({'error': 'Missing required data'}), 400
        
        # Process the image and encode the message
        stego_image = image_steg.encode(image_file, message, password)
        
        # Convert to bytes for response
        img_io = io.BytesIO()
        stego_image.save(img_io, format=image_file.filename.split('.')[-1].upper())
        img_io.seek(0)
        
        # Get the original filename and create a new secure filename
        original_filename = secure_filename(image_file.filename)
        filename_parts = original_filename.rsplit('.', 1)
        stego_filename = f"{filename_parts[0]}_stego.{filename_parts[1]}" if len(filename_parts) > 1 else f"{original_filename}_stego"
        
        return send_file(img_io, download_name=stego_filename, as_attachment=True)
        
    except Exception as e:
        logger.error(f"Error encoding image: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/decode', methods=['POST'])
def decode_image():
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image provided'}), 400
        
        image_file = request.files['image']
        password = request.form.get('password', None)
        
        if not image_file:
            return jsonify({'error': 'Missing image file'}), 400
        
        # Process the image and decode the message
        message = image_steg.decode(image_file, password)
        
        if not message:
            return jsonify({'message': 'No hidden message found or incorrect password'}), 200
        
        return jsonify({'message': message}), 200
        
    except Exception as e:
        logger.error(f"Error decoding image: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/check-capacity', methods=['POST'])
def check_capacity():
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image provided'}), 400
        
        image_file = request.files['image']
        message = request.form.get('message', '')
        
        if not image_file:
            return jsonify({'error': 'Missing image file'}), 400
        
        # Check capacity
        max_capacity, message_size, can_encode = image_steg.check_capacity(image_file, message)
        
        # Calculate percentage of capacity used
        capacity_percent = int((message_size / max_capacity) * 100) if max_capacity > 0 else 100
        
        return jsonify({
            'maxCapacity': max_capacity,
            'messageSize': message_size,
            'canEncode': can_encode,
            'capacityPercent': capacity_percent
        }), 200
        
    except Exception as e:
        logger.error(f"Error checking capacity: {str(e)}")
        return jsonify({'error': str(e)}), 500

# Audio steganography endpoints
@app.route('/audio/encode', methods=['POST'])
def encode_audio():
    try:
        if 'audio' not in request.files:
            return jsonify({'error': 'No audio file provided'}), 400
        
        audio_file = request.files['audio']
        message = request.form.get('message', '')
        
        if not audio_file or not message:
            return jsonify({'error': 'Missing required data'}), 400
        
        if not audio_file.filename.lower().endswith('.wav'):
            return jsonify({'error': 'Only WAV audio files are supported'}), 400
        
        # Process the audio and encode the message
        stego_audio_bytes = audio_steg.encode(audio_file, message)
        
        # Get the original filename and create a new secure filename
        original_filename = secure_filename(audio_file.filename)
        filename_parts = original_filename.rsplit('.', 1)
        stego_filename = f"{filename_parts[0]}_stego.wav" if len(filename_parts) > 1 else f"{original_filename}_stego.wav"
        
        return send_file(
            io.BytesIO(stego_audio_bytes),
            mimetype='audio/wav',
            download_name=stego_filename,
            as_attachment=True
        )
        
    except Exception as e:
        logger.error(f"Error encoding audio: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/audio/decode', methods=['POST'])
def decode_audio():
    try:
        if 'audio' not in request.files:
            return jsonify({'error': 'No audio file provided'}), 400
        
        audio_file = request.files['audio']
        
        if not audio_file:
            return jsonify({'error': 'Missing audio file'}), 400
        
        if not audio_file.filename.lower().endswith('.wav'):
            return jsonify({'error': 'Only WAV audio files are supported'}), 400
        
        # Process the audio and decode the message
        message = audio_steg.decode(audio_file)
        
        if not message:
            return jsonify({'message': 'No hidden message found'}), 200
        
        return jsonify({'message': message}), 200
        
    except Exception as e:
        logger.error(f"Error decoding audio: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
