"""Remove unused embedded texture images; preserve geometry and UV bytes exactly."""
import json, struct, pathlib, hashlib, sys
source, target = map(pathlib.Path, sys.argv[1:])
b = source.read_bytes(); n = struct.unpack_from('<I', b, 12)[0]; d = json.loads(b[20:20+n]); raw = b[28+n:]
image_views = {x['bufferView'] for x in d.get('images', []) if 'bufferView' in x}
kept = {}; data = bytearray(); views = []
for i, v in enumerate(d['bufferViews']):
    if i in image_views: continue
    while len(data) % 4: data.append(0)
    out = dict(v); out['byteOffset'] = len(data); kept[i] = len(views)
    chunk = raw[v.get('byteOffset', 0):v.get('byteOffset', 0)+v['byteLength']]
    data.extend(chunk); views.append(out)
for a in d['accessors']:
    if 'bufferView' in a: a['bufferView'] = kept[a['bufferView']]
d['bufferViews'] = views; d['buffers'] = [{'byteLength': len(data)}]
for key in ['images', 'textures', 'samplers']: d.pop(key, None)
d['materials'] = [{'name': 'Neutral preview', 'doubleSided': True, 'pbrMetallicRoughness': {'baseColorFactor':[1,1,1,1], 'metallicFactor':0, 'roughnessFactor':.85}}]
for m in d['meshes']:
    for p in m['primitives']: p['material'] = 0
js = json.dumps(d, separators=(',',':'),ensure_ascii=False).encode(); js += b' ' * (-len(js)%4); data += b'\0' * (-len(data)%4)
out = struct.pack('<III',0x46546c67,2,28+len(js)+len(data))+struct.pack('<II',len(js),0x4e4f534a)+js+struct.pack('<II',len(data),0x004e4942)+data
target.write_bytes(out)
print(json.dumps({'source':source.name,'sourceSha256':hashlib.sha256(b).hexdigest(),'sourceBytes':len(b),'previewBytes':len(out),'preservedBufferViews':len(views)}))
