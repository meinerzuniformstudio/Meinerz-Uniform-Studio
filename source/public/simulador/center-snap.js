export function snapToCenter(x,{enabled=true,threshold=.025}={}){const snapped=enabled&&Math.abs(x-.5)<=threshold;return {x:snapped?.5:x,snapped};}
