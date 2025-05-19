import numpy as np
import wave
import io
import logging

logger = logging.getLogger(__name__)

class AudioSteganography:
    def __init__(self):
        self.end_marker = "###"
    
    def encode(self, audio_file, message):
        """
        Encode a message into a WAV audio file
        
        Args:
            audio_file: File object containing the WAV audio
            message: String to encode
            
        Returns:
            Bytes of the WAV file with hidden message
        """
        try:
            # Load the audio file
            audio = wave.open(audio_file, 'rb')
            params = audio.getparams()
            n_frames = audio.getnframes()
            audio_data = np.frombuffer(audio.readframes(n_frames), dtype=np.int16)
            audio.close()
            
            # Add the end marker to the message
            full_message = message + self.end_marker
            
            # Convert message to bits
            bits = self._msg_to_bits(full_message)
            
            # Check if the message fits into the audio
            if len(bits) > len(audio_data) // 2:
                raise ValueError("Secret message is too large to hide in this audio file.")
            
            # Copy the audio data
            encoded_data = np.copy(audio_data)
            
            # Encode the message bits
            for i, bit in enumerate(bits):
                # Modify the least significant bit of every 2nd sample
                encoded_data[2 * i] = (audio_data[2 * i] & ~1) | int(bit)
            
            # Save the encoded audio to a bytes buffer
            buffer = io.BytesIO()
            with wave.open(buffer, 'wb') as encoded_audio:
                encoded_audio.setparams(params)
                encoded_audio.writeframes(encoded_data.tobytes())
            
            return buffer.getvalue()
            
        except Exception as e:
            logger.error(f"Error in audio encode: {str(e)}")
            raise
    
    def decode(self, audio_file):
        """
        Decode a message from a WAV audio file
        
        Args:
            audio_file: File object containing the stego audio
            
        Returns:
            Decoded message string or None if no message found
        """
        try:
            # Load the audio file
            audio = wave.open(audio_file, 'rb')
            params = audio.getparams()
            n_frames = audio.getnframes()
            audio_data = np.frombuffer(audio.readframes(n_frames), dtype=np.int16)
            audio.close()
            
            # Extract the LSB from every 2nd sample
            bits = [(audio_data[2 * i] & 1) for i in range(len(audio_data) // 2)]
            
            # Group bits into bytes (8 bits per character)
            bytes_list = [bits[i:i + 8] for i in range(0, len(bits), 8)]
            
            # Convert bytes to characters
            chars = []
            for byte in bytes_list:
                if len(byte) == 8:  # Ensure we have a full byte
                    char = chr(int(''.join(map(str, byte)), 2))
                    chars.append(char)
                    
                    # Check if we've found the end marker
                    if ''.join(chars[-len(self.end_marker):]) == self.end_marker:
                        break
            
            # Join characters and remove end marker
            full_message = ''.join(chars)
            
            if self.end_marker in full_message:
                message = full_message.split(self.end_marker)[0]
                return message
            
            return None
            
        except Exception as e:
            logger.error(f"Error in audio decode: {str(e)}")
            raise
    
    def _msg_to_bits(self, message):
        """Convert a string message to a bit string"""
        return ''.join(format(ord(char), '08b') for char in message)
