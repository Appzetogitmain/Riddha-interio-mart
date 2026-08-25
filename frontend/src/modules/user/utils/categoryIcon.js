import * as LuIcons from 'react-icons/lu';

export const toTitleCase = (str) => {
  if (!str) return '';
  return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

// Resolves a category to an icon component + brand color, either from the
// category's own `icon` field (a custom image URL, or a Lucide icon key) or,
// failing that, a keyword-based fallback guess from the category name.
export const getCategoryIconAndColor = (categoryName, iconKey) => {
  const n = (categoryName || '').toLowerCase();
  let color = '#189D91'; // Default Brand Teal

  if (n.includes('furniture')) color = '#115E59'; // Dark Teal
  else if (n.includes('lighting')) color = '#FB923C'; // Orange
  else if (n.includes('wall')) color = '#8B5CF6'; // Purple
  else if (n.includes('decor')) color = '#EC4899'; // Pink
  else if (n.includes('hardware')) color = '#3B82F6'; // Blue
  else if (n.includes('flooring')) color = '#EA580C'; // Orange-Brown
  else if (n.includes('kitchen')) color = '#22C55E'; // Green
  else if (n.includes('bathroom')) color = '#0D9488'; // Cyan-Teal
  else if (n.includes('office')) color = '#2563EB'; // Blue
  else if (n.includes('outdoor')) color = '#84CC16'; // Lime

  let IconComponent = LuIcons.LuShapes;
  let isCustomImage = false;

  if (iconKey) {
    if (iconKey.startsWith('http://') || iconKey.startsWith('https://') || iconKey.startsWith('/')) {
      isCustomImage = true;
    } else {
      const cleanKey = iconKey.startsWith('Lu') ? iconKey : `Lu${iconKey}`;
      if (cleanKey in LuIcons) {
        IconComponent = LuIcons[cleanKey];
      }
    }
  } else {
    // Fallback legacy mapping based on category name
    if (n.includes('furniture')) IconComponent = LuIcons.LuSofa;
    else if (n.includes('lighting')) IconComponent = LuIcons.LuLampFloor;
    else if (n.includes('wall')) IconComponent = LuIcons.LuLayoutGrid;
    else if (n.includes('decor')) IconComponent = LuIcons.LuFlower2;
    else if (n.includes('hardware')) IconComponent = LuIcons.LuHammer;
    else if (n.includes('flooring')) IconComponent = LuIcons.LuLayoutGrid;
    else if (n.includes('kitchen')) IconComponent = LuIcons.LuChefHat;
    else if (n.includes('bathroom')) IconComponent = LuIcons.LuBath;
    else if (n.includes('office')) IconComponent = LuIcons.LuBriefcase;
    else if (n.includes('outdoor')) IconComponent = LuIcons.LuUmbrella;
  }

  return { IconComponent, color, isCustomImage };
};
