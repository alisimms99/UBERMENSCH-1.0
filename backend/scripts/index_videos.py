#!/usr/bin/env python3
"""
Parse video_library.txt and create a searchable JSON index.
Outputs to backend/data/video_index.json
"""
import os
import json
import hashlib
from pathlib import Path

def parse_video_library(video_library_path):
    """Parse video_library.txt and return structured data."""
    videos = []
    categories_set = set()
    
    # Get the repo root (assuming script is in backend/scripts/)
    repo_root = Path(__file__).parent.parent.parent
    
    video_library_file = repo_root / 'video_library.txt'
    
    if not video_library_file.exists():
        print(f"Error: video_library.txt not found at {video_library_file}")
        return {'videos': [], 'categories': []}
    
    with open(video_library_file, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            
            # Remove leading ./ if present (using removeprefix for Python 3.9+)
            path = line.removeprefix('./')
            
            # Skip if empty after stripping
            if not path:
                continue
            
            # Extract filename
            filename = os.path.basename(path)
            
            # Parse category and subcategory from path
            parts = path.split('/')
            category = None
            subcategory = None
            
            # Remove leading ! from category names
            if len(parts) > 0:
                category = parts[0].lstrip('!')
                categories_set.add(category)
            
            if len(parts) > 1:
                subcategory = parts[1].lstrip('!')
            
            # Create searchable text
            searchable_parts = [filename.lower(), path.lower()]
            if category:
                searchable_parts.append(category.lower())
            if subcategory:
                searchable_parts.append(subcategory.lower())
            
            searchable = ' '.join(searchable_parts)
            
            # Create unique ID from path hash
            path_hash = hashlib.md5(path.encode()).hexdigest()[:12]
            
            video_entry = {
                'id': path_hash,
                'filename': filename,
                'path': path,
                'category': category,
                'subcategory': subcategory,
                'searchable': searchable
            }
            
            videos.append(video_entry)
    
    # Sort categories
    categories = sorted(list(categories_set))
    
    return {
        'videos': videos,
        'categories': categories
    }

def main():
    """Main function to generate video index."""
    # Get paths
    script_dir = Path(__file__).parent
    repo_root = script_dir.parent.parent
    data_dir = repo_root / 'backend' / 'src' / 'data'
    output_file = data_dir / 'video_index.json'
    
    # Ensure data directory exists
    data_dir.mkdir(parents=True, exist_ok=True)
    
    print(f"Parsing video_library.txt...")
    index_data = parse_video_library(None)  # Path is determined inside function
    
    print(f"Found {len(index_data['videos'])} videos")
    print(f"Found {len(index_data['categories'])} categories")
    
    # Write to JSON file
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(index_data, f, indent=2, ensure_ascii=False)
    
    print(f"Video index written to: {output_file}")
    
    # Print sample categories
    print("\nSample categories:")
    for cat in index_data['categories'][:10]:
        print(f"  - {cat}")
    if len(index_data['categories']) > 10:
        print(f"  ... and {len(index_data['categories']) - 10} more")

if __name__ == '__main__':
    main()

