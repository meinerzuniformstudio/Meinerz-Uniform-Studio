// Display-only migration: IDs, asset URLs and saved drawing atlases stay stable.
export const currentCollarName = value => String(value || '').replace(/\bGOLA\s+(?:27|EDGE)\b/gi,'MAX');
export function currentCollarDescriptor(layout) {
  if(!layout)return layout;
  return {...layout,name:currentCollarName(layout.name),
    ...(layout.collar?{collar:/^(?:EDGE|GOLA\s+27|GOLA\s+EDGE)$/i.test(layout.collar)?'MAX':layout.collar}:{}),
    ...(layout.catalogPath?{catalogPath:layout.catalogPath.map(currentCollarName)}:{})};
}
