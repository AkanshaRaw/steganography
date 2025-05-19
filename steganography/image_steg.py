from PIL import Image
import numpy as np
import io
import base64
import hashlib
import logging

logger = logging.getLogger(__name__)

class ImageSteganography:
    def __init__(self):
        self.end_marker = "###"
    
    def encode(self, image_file, message, password=None):
        """
        Encode a message into an image
        
        Args:
            image_file: File object containing the image
            message: String to encode
            password: Optional password for encryption
            
        Returns:
            PIL Image object with hidden message
        """
        try:
            # Open image
            image = Image.open(image_file)
            
            # Convert to RGB if it's not already
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Get image as numpy array
            img_array = np.array(image)
            
            # Encrypt message if password provided
            if password:
                message = self._encrypt_message(message, password)
            
            # Add end marker
            message += self.end_marker
            
            # Convert message to bits
            binary_message = ''.join([format(ord(char), '08b') for char in message])
            
            # Check if message fits in image
            if len(binary_message) > img_array.size:
                raise ValueError("Message is too large for this image")
            
            # Flatten the image to 1D array
            flat_img = img_array.flatten()
            
            # Encode message
            for i, bit in enumerate(binary_message):
                flat_img[i] = (flat_img[i] & ~1) | int(bit)
            
            # Reshape back to original dimensions
            img_array = flat_img.reshape(img_array.shape)
            
            # Convert back to PIL Image
            stego_image = Image.fromarray(img_array)
            
            return stego_image
            
        except Exception as e:
            logger.error(f"Error in encode: {str(e)}")
            raise
    
    def decode(self, image_file, password=None):
        """
        Decode a message from an image
        
        Args:
            image_file: File object containing the stego image
            password: Optional password for decryption
            
        Returns:
            Decoded message string
        """
        try:
            # Open image
            image = Image.open(image_file)
            
            # Convert to RGB if it's not already
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Get image as numpy array
            img_array = np.array(image)
            
            # Flatten the image
            flat_img = img_array.flatten()
            
            # Extract bits
            extracted_bits = ""
            for i in range(min(len(flat_img), 100000)):  # Limit to prevent endless loops
                extracted_bits += str(flat_img[i] & 1)
                
                # Check every 8 bits if we've reached the end marker
                if i % 8 == 7 and i > 8*3*len(self.end_marker):
                    # Convert bits to ASCII
                    extracted_chars = ''.join([chr(int(extracted_bits[j:j+8], 2)) 
                                              for j in range(0, len(extracted_bits), 8)])
                    
                    # Check if end marker is found
                    if self.end_marker in extracted_chars:
                        message = extracted_chars.split(self.end_marker)[0]
                        
                        # Decrypt if password provided
                        if password:
                            try:
                                message = self._decrypt_message(message, password)
                            except Exception:
                                # If decryption fails, it might be wrong password
                                return None
                        
                        return message
            
            # If we get here, no message was found
            return None
            
        except Exception as e:
            logger.error(f"Error in decode: {str(e)}")
            raise
    
    def check_capacity(self, image_file, message):
        """
        Check if an image has enough capacity for a message
        
        Args:
            image_file: File object containing the image
            message: String to potentially encode
            
        Returns:
            Tuple of (max_capacity, message_size, can_encode)
        """
        try:
            # Open image
            image = Image.open(image_file)
            
            # Convert to RGB if it's not already
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Calculate maximum capacity
            max_capacity = image.width * image.height * 3 // 8  # Each pixel has 3 channels, each bit holds 1/8 of a character
            
            # Add end marker to get total required size
            full_message = message + self.end_marker
            message_size = len(full_message)
            
            # Determine if message can be encoded
            can_encode = message_size <= max_capacity
            
            return max_capacity, message_size, can_encode
            
        except Exception as e:
            logger.error(f"Error in check_capacity: {str(e)}")
            raise
    
    def _encrypt_message(self, message, password):
        """Simple XOR encryption with password"""
        key = self._generate_key(password, len(message))
        encrypted = ''.join(chr(ord(c) ^ ord(k)) for c, k in zip(message, key))
        return encrypted
    
    def _decrypt_message(self, encrypted, password):
        """Simple XOR decryption with password"""
        return self._encrypt_message(encrypted, password)  # XOR is symmetric
    
    def _generate_key(self, password, length):
        """Generate a key of desired length from a password"""
        key = ""
        password_bytes = password.encode('utf-8')
        while len(key) < length:
            # Use hash to extend the password to desired length
            hash_obj = hashlib.sha256((password + str(len(key))).encode('utf-8'))
            key += hash_obj.hexdigest()
        return key[:length]
