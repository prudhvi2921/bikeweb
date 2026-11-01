import os
import re
import time
from concurrent.futures import ProcessPoolExecutor
from PIL import Image
import numpy as np

def natural_sort_key(s):
    return [int(text) if text.isdigit() else text.lower() for text in re.split(r'(\d+)', s)]

def are_frames_nearly_identical(im1_path, im2_path, threshold=2.0):
    a1 = np.array(Image.open(im1_path).convert('RGB')).astype(float)
    a2 = np.array(Image.open(im2_path).convert('RGB')).astype(float)
    diff = np.mean(np.abs(a1 - a2))
    return diff < threshold, diff

def process_single_frame(task):
    src_path, dst_desktop, dst_mobile = task
    with Image.open(src_path) as img:
        img_rgb = img.convert('RGB')
        orig_w, orig_h = img_rgb.size
        
        # Desktop: 1600px wide, quality 78
        w_d = 1600
        h_d = round(w_d * orig_h / orig_w)
        img_d = img_rgb.resize((w_d, h_d), Image.Resampling.LANCZOS)
        img_d.save(dst_desktop, 'WEBP', quality=78, method=4)
        
        # Mobile: 960px wide, quality 72
        w_m = 960
        h_m = round(w_m * orig_h / orig_w)
        img_m = img_rgb.resize((w_m, h_m), Image.Resampling.LANCZOS)
        img_m.save(dst_mobile, 'WEBP', quality=72, method=4)
    return True

def main():
    start_time = time.time()
    
    # 1. Output directories
    dirs = [
        os.path.join('assets', 'frames', 'hero'),
        os.path.join('assets', 'frames', 'hero-mobile'),
        os.path.join('assets', 'frames', 'dismantle'),
        os.path.join('assets', 'frames', 'dismantle-mobile'),
        os.path.join('assets', 'cars')
    ]
    for d in dirs:
        os.makedirs(d, exist_ok=True)

    # 2. Source directories
    c1_dir = os.path.join('frames', 'hero section', 'clip 1')
    c2_dir = os.path.join('frames', 'hero section', 'clip 2')
    c3_dir = os.path.join('frames', 'hero section', 'clip 3')
    dis_dir = os.path.join('frames', 'dismantle')

    c1_files = [os.path.join(c1_dir, f) for f in sorted(os.listdir(c1_dir), key=natural_sort_key)]
    c2_files = [os.path.join(c2_dir, f) for f in sorted(os.listdir(c2_dir), key=natural_sort_key)]
    c3_files = [os.path.join(c3_dir, f) for f in sorted(os.listdir(c3_dir), key=natural_sort_key)]
    dis_files = [os.path.join(dis_dir, f) for f in sorted(os.listdir(dis_dir), key=natural_sort_key)]

    # Check joins
    hero_files = list(c1_files)
    
    identical_c2, diff_c2 = are_frames_nearly_identical(hero_files[-1], c2_files[0])
    print(f"Join Clip1 -> Clip2 diff: {diff_c2:.2f}. Nearly identical: {identical_c2}")
    if identical_c2:
        print("Skipping first frame of Clip 2")
        hero_files.extend(c2_files[1:])
    else:
        hero_files.extend(c2_files)

    identical_c3, diff_c3 = are_frames_nearly_identical(hero_files[-1], c3_files[0])
    print(f"Join Clip2 -> Clip3 diff: {diff_c3:.2f}. Nearly identical: {identical_c3}")
    if identical_c3:
        print("Skipping first frame of Clip 3")
        hero_files.extend(c3_files[1:])
    else:
        hero_files.extend(c3_files)

    print(f"Total hero source frames to process: {len(hero_files)}")
    print(f"Total dismantle source frames to process: {len(dis_files)}")

    # Prepare tasks
    tasks = []
    
    # Hero tasks
    hero_out_d = os.path.join('assets', 'frames', 'hero')
    hero_out_m = os.path.join('assets', 'frames', 'hero-mobile')
    for idx, src in enumerate(hero_files, start=1):
        fname = f"frame_{idx:04d}.webp"
        tasks.append((src, os.path.join(hero_out_d, fname), os.path.join(hero_out_m, fname)))

    # Dismantle tasks
    dis_out_d = os.path.join('assets', 'frames', 'dismantle')
    dis_out_m = os.path.join('assets', 'frames', 'dismantle-mobile')
    for idx, src in enumerate(dis_files, start=1):
        fname = f"frame_{idx:04d}.webp"
        tasks.append((src, os.path.join(dis_out_d, fname), os.path.join(dis_out_m, fname)))

    print(f"Starting conversion of {len(tasks)} frames using ProcessPoolExecutor...")
    with ProcessPoolExecutor() as executor:
        results = list(executor.map(process_single_frame, tasks))
    print(f"Completed {len(results)} frames in {time.time() - start_time:.2f} seconds.")

    # Calculate statistics
    for folder_name, folder_path in [
        ('assets/frames/hero', hero_out_d),
        ('assets/frames/hero-mobile', hero_out_m),
        ('assets/frames/dismantle', dis_out_d),
        ('assets/frames/dismantle-mobile', dis_out_m)
    ]:
        fl = os.listdir(folder_path)
        total_bytes = sum(os.path.getsize(os.path.join(folder_path, f)) for f in fl)
        size_mb = total_bytes / (1024 * 1024)
        print(f"OUTPUT [{folder_name}]: {len(fl)} frames, {size_mb:.2f} MB ({total_bytes} bytes)")

if __name__ == '__main__':
    main()
