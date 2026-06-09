"""Basic test to verify pytest is working"""

def test_import_system_modules():
    """Test that basic Python modules can be imported"""
    import sys
    import os
    import json
    assert sys.version_info >= (3, 10)

def test_project_structure():
    """Test that project files exist"""
    import os
    assert os.path.exists("macs.py") or os.path.exists("tests/test_macs.py")

if __name__ == "__main__":
    print("Running basic tests...")
    test_import_system_modules()
    test_project_structure()
    print("Basic tests passed!")
