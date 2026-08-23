declare module '*.module.css' {
  const classes: { readonly [key: string]: string };

  export default classes;
}

// The package ships types behind an "exports" map, which this project's
// `moduleResolution: node` cannot read. Declare the subpath we use.
declare module '@designcodeio/threeui/components/RibbonFieldBackground' {
  export type RibbonFieldBackgroundProps = {
    speed?: number;
    pointerAmount?: number;
    smoothing?: number;
    brightness?: number;
    opacity?: number;
    hue?: number;
    saturation?: number;
    className?: string;
  };

  export function RibbonFieldBackground(
    props: RibbonFieldBackgroundProps,
  ): JSX.Element;
}
