import type {
	ComponentProps,
	ComponentType,
	ReactElement,
	ReactNode,
	Ref,
} from "react";
import type { Falsy, PressableProps, View } from "react-native";
import { cn } from "~/utils";
import { Icon } from "./icons";
import { PressableFeedback } from "./links";
import { P } from "./text";

export const Button = <AsProps = PressableProps>({
	text,
	icon,
	ricon,
	left,
	right,
	disabled,
	as,
	ref,
	children,
	className,
	textClassName,
	...props
}: {
	disabled?: boolean | null;
	text?: string;
	icon?: ComponentProps<typeof Icon>["icon"] | Falsy;
	left?: ReactElement | Falsy;
	ricon?: ComponentProps<typeof Icon>["icon"] | Falsy;
	right?: ReactElement | Falsy;
	children?: ReactNode;
	ref?: Ref<View>;
	className?: string;
	textClassName?: string;
	as?: ComponentType<AsProps>;
} & AsProps) => {
	const Container = as ?? PressableFeedback;
	return (
		<Container
			ref={ref as any}
			disabled={disabled}
			className={cn(
				"flex-row items-center justify-center overflow-hidden",
				"rounded-sm border border-kyoo-border-control bg-kyoo-surface px-4 py-2.5 outline-0",
				disabled && "border-kyoo-border opacity-50",
				"group highlighted:border-accent highlighted:bg-kyoo-surface-hover",
				className,
			)}
			{...(props as AsProps)}
		>
			{icon && (
				<Icon icon={icon} className="mx-2 group-highlighted:fill-slate-200" />
			)}
			{left}
			{text && (
				<P className="text-center font-medium text-kyoo-text-primary group-highlighted:text-kyoo-accent">{text}</P>
			)}
			{children}
			{right}
			{ricon && (
				<Icon icon={ricon} className="mx-2 group-highlighted:fill-slate-200" />
			)}
		</Container>
	);
};
