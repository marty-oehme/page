content := """---
title:
description:
pubDate:
tags:
  - 
weight: 10
---"""

today := `date "+%Y-%m-%d"`

# create new blog post with given title slug
post title='post-title':
    mkdir "content/{{today}}-{{title}}"
    echo "{{content}}" > "content/{{today}}-{{title}}/index.md"

