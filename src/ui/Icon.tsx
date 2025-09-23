import { forwardRef } from "react";
import type { SVGProps } from "react";
import {
  getIconDefinition,
  type IconDefinition,
  type IconWeight,
  type KnownIconName,
} from "./icon-registry";

export type IconName = KnownIconName;

export type IconProps = {
  name: IconName;
  size?: number;
  stroke?: number;
  weight?: IconWeight;
  className?: string;
  title?: string;
} & Omit<SVGProps<SVGSVGElement>, "ref" | "name">;

const DEFAULT_SIZE = 20;
const DEFAULT_STROKE = 1.8;
const DEFAULT_WEIGHT: IconWeight = "regular";

export const Icon = forwardRef<SVGSVGElement, IconProps>(
  ({
    name,
    size = DEFAULT_SIZE,
    stroke,
    weight,
    className,
    title,
    ...rest
  }, ref) => {
    const definition: IconDefinition | undefined = getIconDefinition(name);

    if (!definition) {
      if (import.meta.env?.DEV) {
        console.warn(`Icon "${name}" is not registered.`);
      }
      return null;
    }

    const { component: Component, source, defaultWeight, defaultStroke } = definition;
    const resolvedStroke = stroke ?? defaultStroke ?? DEFAULT_STROKE;
    const resolvedWeight = weight ?? defaultWeight ?? DEFAULT_WEIGHT;

    const labelled = rest["aria-label"] != null || rest["aria-labelledby"] != null;

    const baseProps: Record<string, unknown> = {
      ref,
      className,
      color: "currentColor",
      title,
      role: title ? "img" : undefined,
      ...rest,
    };

    if (!title && !labelled) {
      baseProps["aria-hidden"] = true;
    }

    switch (source) {
      case "phosphor":
        return <Component {...baseProps} size={size} weight={resolvedWeight} />;
      case "radix":
        return <Component {...baseProps} width={size} height={size} />;
      default:
        return <Component {...baseProps} size={size} strokeWidth={resolvedStroke} />;
    }
  }
);

Icon.displayName = "Icon";

export default Icon;
