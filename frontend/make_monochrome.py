import os
import re

directory = '/home/hrishikesh/Desktop/Final-Yr-Project/DevSync/frontend/src'

replacements = [
    (r'(?:emerald|blue|purple|indigo|green|rose|pink)-500/(\d+)', r'white/\1'),
    (r'(?:emerald|blue|purple|indigo|green|rose|pink)-400/(\d+)', r'white/\1'),
    (r'(?:emerald|blue|purple|indigo|green|rose|pink)-500', 'white'),
    (r'(?:emerald|blue|purple|indigo|green|rose|pink)-400', 'gray-300'),
    (r'(?:emerald|blue|purple|indigo|green|rose|pink)-600', 'gray-400'),
    (r'(?:emerald|blue|purple|indigo|green|rose|pink)-300', 'gray-200'),
    (r'(?:emerald|blue|purple|indigo|green|rose|pink)-700', 'gray-500'),
    (r'(?:emerald|blue|purple|indigo|green|rose|pink)-800', 'gray-600'),
    (r'(?:emerald|blue|purple|indigo|green|rose|pink)-900', 'gray-700'),
    (r'selection:bg-(?:emerald|blue|purple|indigo|green|rose|pink)', 'selection:bg-white'),
    (r'shadow-(?:emerald|blue|purple|indigo|green|rose|pink)', 'shadow-white'),
    (r'from-(?:emerald|blue|purple|indigo|green|rose|pink)', 'from-gray-800'),
    (r'to-(?:emerald|blue|purple|indigo|green|rose|pink)', 'to-gray-900'),
    (r'via-(?:emerald|blue|purple|indigo|green|rose|pink)', 'via-gray-800'),
    (r'ring-(?:emerald|blue|purple|indigo|green|rose|pink)', 'ring-white'),
    (r'focus:ring-(?:emerald|blue|purple|indigo|green|rose|pink)', 'focus:ring-white'),
    (r'focus:border-(?:emerald|blue|purple|indigo|green|rose|pink)', 'focus:border-white'),
    (r'hover:border-(?:emerald|blue|purple|indigo|green|rose|pink)', 'hover:border-white'),
    (r'hover:text-(?:emerald|blue|purple|indigo|green|rose|pink)', 'hover:text-white'),
    (r'text-(?:emerald|blue|purple|indigo|green|rose|pink)', 'text-gray-300'),
    (r'bg-(?:emerald|blue|purple|indigo|green|rose|pink)', 'bg-white'),
    (r'border-(?:emerald|blue|purple|indigo|green|rose|pink)', 'border-gray-700'),
]

for root, _, files in os.walk(directory):
    for file in files:
        if file.endswith(('.tsx', '.ts')):
            path = os.path.join(root, file)
            with open(path, 'r') as f:
                content = f.read()
            
            original = content
            for pat, repl in replacements:
                content = re.sub(pat, repl, content)
            
            if content != original:
                with open(path, 'w') as f:
                    f.write(content)
                print(f"Updated {path}")
