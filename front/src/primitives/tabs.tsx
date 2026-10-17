import { type Falsy, Pressable, ScrollView } from "react-native";
import { cn } from "~/utils";
import { Icon, type Icon as IconType } from "./icons";
import { P } from "./text";

export const Tabs = <T,>({
	tabs: _tabs,
	value,
	setValue,
	className,
	disabled,
	...props
}: {
	tabs: (
		| {
				label: string;
				value: T;
				icon: IconType;
		  }
		| Falsy
	)[];
	value: string;
	setValue: (value: T) => void;
	className?: string;
	disabled?: boolean;
}) => {
	const tabs = _tabs.filter((x) => x) as {
		label: string;
		value: T;
		icon: IconType;
	}[];

	return (
		<ScrollView
			horizontal
			// @ts-expect-error uniwind special props
			containerClassName={cn("shrink flex-row items-center", className)}
			className={cn(
				"border-b border-kyoo-border-strong",
				disabled && "opacity-50",
			)}
			showsHorizontalScrollIndicator={false}
			{...props}
		>
			{tabs.map((x) => {
				const selected = x.value === value;
				return (
					<Pressable
						key={`${x.value}`}
						disabled={disabled}
						onPress={() => setValue(x.value)}
						className={cn(
							"group flex-row items-center justify-center rounded-t-sm border-b-2 border-transparent px-3 py-3 outline-0",
							"highlighted:bg-kyoo-surface-selected highlighted:outline-2 highlighted:outline-accent",
							selected && "border-kyoo-accent bg-kyoo-surface-selected",
						)}
					>
						<Icon
							icon={x.icon}
							className={cn(
								"mr-1.5 h-5 w-5 fill-kyoo-text-muted",
								selected && "fill-kyoo-accent",
							)}
						/>
						<P
							className={cn(
								"text-sm font-medium text-kyoo-text-dim",
								selected && "font-semibold text-kyoo-accent",
							)}
						>
							{x.label}
						</P>
					</Pressable>
				);
			})}
		</ScrollView>
	);
};
