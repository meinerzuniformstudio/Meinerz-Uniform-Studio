"""Cycles studio product renders of the actual catalog panels, with no mannequin.
Use Blender's bundled Python; export-only mesh shell and material leave GLBs intact.
"""
import bpy,math,json,pathlib,sys,time,struct
import numpy as np
from mathutils import Vector
ROOT=pathlib.Path(__file__).resolve().parents[1]
args=sys.argv[sys.argv.index('--')+1:];jobs=json.loads(pathlib.Path(args[0]).read_text())
def acc(g,b,i):
 a=g['accessors'][i];v=g['bufferViews'][a['bufferView']];n={'SCALAR':1,'VEC2':2,'VEC3':3}[a['type']];dt={5126:'<f4',5123:'<u2',5125:'<u4'}[a['componentType']];return np.frombuffer(b,dtype=dt,offset=v.get('byteOffset',0)+a.get('byteOffset',0),count=a['count']*n).reshape(-1,n)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.device='CPU';scene.cycles.samples=64;scene.cycles.use_denoising=False;scene.render.threads_mode='FIXED';scene.render.threads=4
scene.render.resolution_x=640;scene.render.resolution_y=600;scene.render.resolution_percentage=100;scene.render.film_transparent=True;scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA';scene.render.image_settings.color_depth='8';scene.render.use_file_extension=True
scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast';scene.view_settings.exposure=0;scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.75,.78,.82,1);scene.world.node_tree.nodes['Background'].inputs[1].default_value=.22
cam_data=bpy.data.cameras.new('Product camera');cam=bpy.data.objects.new('Product camera',cam_data);scene.collection.objects.link(cam);cam.location=(0,-2,.405);cam.rotation_euler=(Vector((0,0,.405))-cam.location).to_track_quat('-Z','Y').to_euler();cam_data.type='ORTHO';cam_data.ortho_scale=.56;scene.camera=cam
for name,loc,energy,size in [('Large softbox',(-.45,-.7,.9),18,.5),('Soft fill',(.5,-.35,.5),5,.55),('Top rim',(.1,.35,.85),12,.4)]:
 ld=bpy.data.lights.new(name,'AREA');lo=bpy.data.objects.new(name,ld);scene.collection.objects.link(lo);lo.location=loc;lo.rotation_euler=(Vector((0,0,.42))-lo.location).to_track_quat('-Z','Y').to_euler();ld.energy=energy;ld.shape='DISK';ld.size=size
materials={}
for name,color,exterior in [('white',(.58,.60,.63,1),False),('black',(.002,.003,.005,1),False),('white-exterior',(.58,.60,.63,1),True),('black-exterior',(.002,.003,.005,1),True)]:
 mat=bpy.data.materials.new(name);mat.use_nodes=True;n=mat.node_tree.nodes;links=mat.node_tree.links;bsdf=n.get('Principled BSDF');bsdf.inputs['Base Color'].default_value=color;bsdf.inputs['Roughness'].default_value=.78;bsdf.inputs['Sheen Weight'].default_value=.2 if name.startswith('white') else .025;bsdf.inputs['Specular IOR Level'].default_value=.35 if name.startswith('white') else .15;bsdf.inputs['Sheen Roughness'].default_value=.8
 noise=n.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=1350;noise.inputs['Detail'].default_value=2;noise.inputs['Roughness'].default_value=.6;bump=n.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.12;bump.inputs['Distance'].default_value=.00006;links.new(noise.outputs['Fac'],bump.inputs['Height']);links.new(bump.outputs['Normal'],bsdf.inputs['Normal']);materials[name]=mat
 if exterior:
  # A worn shirt conceals its inward-facing hem. Keep those faces for light
  # transport, but let primary camera rays see the shorts underneath instead.
  geometry=n.new('ShaderNodeNewGeometry');lightpath=n.new('ShaderNodeLightPath');camera_back=n.new('ShaderNodeMath');camera_back.operation='MULTIPLY';links.new(geometry.outputs['Backfacing'],camera_back.inputs[0]);links.new(lightpath.outputs['Is Camera Ray'],camera_back.inputs[1]);transparent=n.new('ShaderNodeBsdfTransparent');mix=n.new('ShaderNodeMixShader');links.new(camera_back.outputs[0],mix.inputs[0]);links.new(bsdf.outputs[0],mix.inputs[1]);links.new(transparent.outputs[0],mix.inputs[2]);links.new(mix.outputs[0],n.get('Material Output').inputs['Surface'])
for job in jobs:
 start=time.time();raw=(ROOT/('public'+job['model'])).read_bytes();jlen=struct.unpack_from('<I',raw,12)[0];g=json.loads(raw[20:20+jlen]);b=raw[28+jlen:];objects=[]
 for p in job['panels']:
  label=p['label'];short=label.startswith(('Calção','Cós','Bermuda'));pr=g['meshes'][p['mesh']]['primitives'][0];pos=acc(g,b,pr['attributes']['POSITION']);norm=acc(g,b,pr['attributes']['NORMAL']);idx=acc(g,b,pr['indices']).reshape(-1,3)
  verts=np.column_stack((pos[:,0],-pos[:,2],pos[:,1])).tolist();normal=np.column_stack((norm[:,0],-norm[:,2],norm[:,1])).tolist();mesh=bpy.data.meshes.new(label);mesh.from_pydata(verts,[],idx.tolist());mesh.update();mesh.polygons.foreach_set('use_smooth',[True]*len(mesh.polygons));mesh.normals_split_custom_set_from_vertices(normal)
  black=label.startswith(('Gola','Colarinho','Peitilho','Filete','Cós','Recorte')) or label.startswith('Calção lateral');exterior=(not short) and (label in ['Frente','Costas'] or label.startswith('Recorte'));mesh.materials.append(materials[('black' if black else 'white')+('-exterior' if exterior else '')])
  for side,offset in [(0,-.15),(1,.15)]:
   obj=bpy.data.objects.new(label+str(side),mesh);scene.collection.objects.link(obj);objects.append(obj);obj.location.x=offset;obj.rotation_euler.z=side*math.pi;obj.visible_camera=(short==(job['kind']=='shorts'));obj.hide_render=not obj.visible_camera
   if not exterior:
    mod=obj.modifiers.new('Fabric edge thickness','SOLIDIFY');mod.thickness=.00018;mod.offset=0
 scene.render.filepath=str(ROOT/'work/kit-realistic'/job['filename']);bpy.ops.render.render(write_still=True)
 for obj in objects:bpy.data.objects.remove(obj,do_unlink=True)
 for mesh in list(bpy.data.meshes):
  if mesh.users==0:bpy.data.meshes.remove(mesh)
 print('RENDERED',job['filename'],round(time.time()-start,2),flush=True)
