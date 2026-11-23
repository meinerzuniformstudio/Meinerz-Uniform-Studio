"""Image regression for the formerly exposed inner back hem (MAX front view)."""
import json,pathlib,unittest
from PIL import Image
ROOT=pathlib.Path(__file__).resolve().parents[1]
class WornKitHem(unittest.TestCase):
 def test_inward_back_hem_is_hidden_but_outer_front_and_back_remain(self):
  catalog=json.loads((ROOT/'public/simulador/kit-previews.js').read_text().split('=',1)[1].strip().rstrip(';'))
  key=next(k for k in catalog if k.startswith('pack26-normal-max-com-recorte-maxbatch-20261113-paired-v1-proporcao-v1-'))
  im=Image.open(ROOT/('public'+catalog[key]['shirt'])).convert('RGBA')
  self.assertEqual(im.size,(640,600))
  self.assertGreater(im.getpixel((150,300))[3],240,'front body must remain visible')
  self.assertGreater(im.getpixel((490,397))[3],240,'longer outside back hem must remain intact')
  for y in [391,397,403]:self.assertLess(im.getpixel((150,y))[3],10,'inward back hem must not form a band in front')
 def test_prestige_waistband_tucks_under_the_shorter_front_hem(self):
  catalog=json.loads((ROOT/'public/simulador/kit-previews.js').read_text().split('=',1)[1].strip().rstrip(';'))
  entry=next(v for k,v in catalog.items() if k.startswith('pack26-normal-prestige-com-recorte-prestigebatch-20261113-paired-v1-derived-v1-proporcao-v1-'))
  shirt=Image.open(ROOT/('public'+entry['shirt'])).convert('RGBA');shorts=Image.open(ROOT/('public'+entry['shorts'])).convert('RGBA');kit=Image.new('RGBA',shirt.size,'white');kit.alpha_composite(shorts,dest=(0,-entry['shortsLift']));kit.alpha_composite(shirt)
  for x in [145,149,153]:
   hem=max(y for y in range(460) if shirt.getpixel((x,y))[3]>240)
   for y in range(hem+2,hem+7):self.assertGreater(sum(kit.getpixel((x,y))[:3])/3,110,'dark waistband must remain beneath the shirt')
if __name__=='__main__':unittest.main()
