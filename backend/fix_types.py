import glob
import re

for file in glob.glob('app/models/*.py'):
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if ' | None' in content or 'Optional' not in content:
        if 'from typing import ' in content and 'Optional' not in content:
            content = content.replace('from typing import ', 'from typing import Optional, ')
        elif 'from typing import' not in content:
            content = 'from typing import Optional\n' + content
        
        # Replace Mapped[Type | None] with Mapped[Optional[Type]]
        content = re.sub(r'Mapped\[([A-Za-z0-9_\"\.]+) \| None\]', r'Mapped[Optional[\1]]', content)
        
        with open(file, 'w', encoding='utf-8') as f:
            f.write(content)
        print('Updated', file)
