import type { GestureResponderEvent } from "react-native";
import { View } from "react-native";
import { cn } from "~/utils";
import { Link } from "./links";
import { Skeleton } from "./skeleton";
import { P } from "./text";
import { capitalize } from "./utils";

export const Chip = ({
	size = "medium",
	outline = false,
	label,
	href,
	replace,
	className,
	...props
}: {
	size?: "small" | "medium" | "large";
	outline?: boolean;
	label: string;
	href: string | null;
	replace?: boolean;
	onPress?: (e: GestureResponderEvent) => void;
	className?: string;
}) => {
	return (
		<Link
			href={href}
			replace={replace}
			className={cn(
				"group justify-center overflow-hidden rounded-sm border border-[#58738a] outline-0",
				size === "small" && "px-2.5 py-1",
				size === "medium" && "px-5 py-2",
				size === "large" && "px-10 py-4",
				outline && "highlighted:bg-[#2f4a63]",
				!outline && "bg-[#2c4762] highlighted:bg-[#3a5872]",
				className,
			)}
			{...props}
		>
			<P
				className={cn(
					outline && "text-[#f0c875] group-highlighted:text-[#f5efe1]",
					!outline && "text-[#f5efe1] dark:text-[#f5efe1]",
					size === "small" && "text-sm",
				)}
			>
				{capitalize(label)}
			</P>
		</Link>
	);
};

Chip.Loader = ({
	size = "medium",
	outline = false,
	className,
	...props
}: {
	size?: "small" | "medium" | "large";
	outline?: boolean;
	className?: string;
}) => {
	return (
		<View
			className={cn(
				"group justify-center overflow-hidden rounded-sm border border-[#58738a] outline-0",
				size === "small" && "px-2.5 py-1",
				size === "medium" && "px-5 py-2",
				size === "large" && "px-10 py-4",
				!outline && "bg-[#2c4762]",
				className,
			)}
			{...props}
		>
			<Skeleton className="w-10" />
		</View>
	);
};
