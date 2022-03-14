1.创建新的index
```
PUT my_index_v2
{
  ....
}
```

2.将数据从之前的index复制到新index
```
POST _reindex
{
  "source": {"index": "my_index_v1"},
  "dest": {"index": "my_index_v2"}
}

```


3.为新的index设置别名，并且删除之前index的别名
```
POST /_aliases
{
    "actions": [
        { "remove": { "index": "my_index_v1", "alias": "my_index" }},
        { "add":    { "index": "my_index_v2", "alias": "my_index" }}
    ]
}
```
