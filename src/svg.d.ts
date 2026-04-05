declare module '*.svg' {
  import type { ComponentType } from 'react';
  import type { SvgProps } from 'react-native-svg';
  const SVGComponent: ComponentType<SvgProps>;
  export default SVGComponent;
}
