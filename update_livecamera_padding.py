import re

filepath = r"C:\Users\sabit\.gemini\antigravity\scratch\emotionsense\src\pages\LiveCamera.jsx"
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace padding block 1
content = re.sub(
    r"const padX = Math\.floor\(fw \* 0\.25\);\s*const padY = Math\.floor\(fh \* 0\.25\);\s*const fxP = Math\.max\(0, fx - padX\);\s*const fyP = Math\.max\(0, fy - padY\);\s*const fwP = Math\.min\(displaySize\.width - fxP, fw \+ 2 \* padX\);\s*const fhP = Math\.min\(displaySize\.height - fyP, fh \+ 2 \* padY\);",
    "const fxP = fx;\n            const fyP = fy;\n            const fwP = fw;\n            const fhP = fh;",
    content
)

# Also remove the comment "// Context expansion margin (25% padding)" if present
content = re.sub(
    r"// Context expansion margin \(25% padding\)\s*",
    "",
    content
)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("LiveCamera.jsx updated successfully to remove padding.")
