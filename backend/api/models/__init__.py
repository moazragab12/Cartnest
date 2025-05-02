import sys
import os
# Get the absolute path to the project root directory
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(ROOT_DIR)

# No model definitions should be here - models should be in their respective directories
# This file should be used only for imports and package initialization
