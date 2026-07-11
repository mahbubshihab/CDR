import Quartz
import Vision
from Foundation import NSURL
import sys
import os

def recognize_text(image_path):
    url = NSURL.fileURLWithPath_(image_path)
    request = Vision.VNRecognizeTextRequest.alloc().init()
    handler = Vision.VNImageRequestHandler.alloc().initWithURL_options_(url, None)
    success, error = handler.performRequests_error_([request], None)
    if success:
        texts = [observation.topCandidates_(1)[0].string() for observation in request.results()]
        return "\n".join(texts)
    else:
        return f"Error: {error}"

def analyze_all_images(directory, output_file):
    with open(output_file, 'w') as f:
        f.write("# Image Analysis Results\n\n")
        for filename in sorted(os.listdir(directory)):
            if filename.lower().endswith('.png') or filename.lower().endswith('.jpg'):
                path = os.path.join(directory, filename)
                f.write(f"## {filename}\n")
                print(f"Processing {filename}...")
                text = recognize_text(path)
                f.write("```\n" + text + "\n```\n\n")

if __name__ == '__main__':
    if len(sys.argv) > 2:
        analyze_all_images(sys.argv[1], sys.argv[2])
    else:
        print("Usage: python analyze_dir.py <dir_path> <output_file>")
