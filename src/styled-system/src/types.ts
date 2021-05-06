import type { Dict, AnalyzeBreakpointsReturn } from "../../utils"
import type * as CSS from "csstype"
import type {
  BackgroundProps,
  BorderProps,
  ColorProps,
  FlexboxProps,
  GridProps,
  LayoutProps,
  ListProps,
  OtherProps,
  OutlineProps,
  PositionProps,
  ShadowProps,
  SpaceProps,
  TransformProps,
  TransitionProps,
  TypographyProps,
} from "./config"
import type { Pseudos } from "./pseudos"
import type { ResponsiveValue } from "./utils"

export interface StyleProps
  extends SpaceProps,
    ColorProps,
    TransitionProps,
    TypographyProps,
    FlexboxProps,
    TransformProps,
    GridProps,
    LayoutProps,
    BorderProps,
    ShadowProps,
    BackgroundProps,
    ListProps,
    PositionProps,
    OutlineProps,
    OtherProps {}

export interface SystemCSSProperties extends CSS.Properties, Omit<StyleProps, keyof CSS.Properties> {}

export type ThemeThunk<T> = T | ((theme: Dict) => T)

type PropertyValue<K extends keyof SystemCSSProperties> = ThemeThunk<
  ResponsiveValue<boolean | number | string | SystemCSSProperties[K]>
>

export type CSSWithMultiValues = {
  [K in keyof SystemCSSProperties]?: K extends keyof StyleProps ? StyleProps[K] | PropertyValue<K> : PropertyValue<K>
}

type PseudoKeys = CSS.Pseudos | keyof Pseudos

type PseudoSelectorDefinition<D> = D | RecursivePseudo<D>

export type RecursivePseudo<D> = {
  [K in PseudoKeys]?: PseudoSelectorDefinition<D> & D
}

type CSSDefinition<D> = D | string | RecursiveCSSSelector<D | string>

export interface RecursiveCSSSelector<D> {
  [selector: string]: CSSDefinition<D> & D
}

export type RecursiveCSSObject<D> = D & (RecursivePseudo<D> | RecursiveCSSSelector<D>)

export type CSSObject = RecursiveCSSObject<CSSWithMultiValues>

type a = RecursiveCSSObject<CSSWithMultiValues>

export type SystemStyleObject = CSSObject

export interface FunctionCSSInterpolation {
  (theme: Dict): CSSObject
}

export type StyleObjectOrFn = CSSObject | FunctionCSSInterpolation

type PseudoProps = {
  [K in keyof Pseudos]?: SystemStyleObject
}

export interface SystemProps extends StyleProps, PseudoProps {}

export type CSSMap = Dict<{ value: string; var: string; varRef: string }>

export type Transform = (value: any, theme: CssTheme, styles?: Dict) => any

export type WithCSSVar<T> = T & {
  __cssVars: Dict
  __cssMap: CSSMap
  __breakpoints: AnalyzeBreakpointsReturn
}

export type CssTheme = WithCSSVar<{
  breakpoints: Dict
  direction?: "ltr" | "rtl"
  [key: string]: any
}>
