import { Children, Fragment, type ReactElement, type ReactNode } from "react";
import { type Falsy, View } from "react-native";
import type { User } from "~/models";
import { Container, FocusGroup, H1, HR, Icon, P, SubP } from "~/primitives";
import { useAccount } from "~/providers/account-context";
import { useMutation } from "~/query";

export const Preference = ({
	customIcon,
	icon,
	label,
	description,
	children,
	...props
}: {
	customIcon?: ReactElement | Falsy;
	icon: Icon;
	label: string | ReactElement;
	description: string | ReactElement;
	children?: ReactNode;
}) => {
	return (
		<View
			className="mx-3 my-4 flex-1 flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between"
			{...props}
		>
			<View className="mx-1 min-w-0 flex-row items-start gap-3 sm:flex-1 sm:items-center">
				{customIcon ?? <Icon icon={icon} className="mt-0.5 h-5 w-5 shrink-0 fill-kyoo-text-muted sm:mt-0" />}
				<View className="min-w-0 flex-1">
					<P className="font-semibold text-kyoo-text-primary">{label}</P>
					<SubP className="mt-0.5 text-sm leading-5 text-kyoo-text-muted">{description}</SubP>
				</View>
			</View>
			<View className="ml-9 mr-1 flex-row flex-wrap items-center justify-start gap-2 sm:ml-3 sm:mr-2 sm:max-w-[45%] sm:justify-end">
				{children}
			</View>
		</View>
	);
};

export const SettingsContainer = ({
	children,
	title,
	extra,
	extraTop,
	...props
}: {
	children: ReactNode;
	title: string;
	extra?: ReactNode;
	extraTop?: ReactNode;
}) => {
	return (
		<Container {...props}>
			<H1 className="mb-3 mt-2 font-headers text-[36px] font-bold text-kyoo-text-primary">{title}</H1>
			{extraTop}
			<View className="rounded-sm border border-kyoo-border bg-card">
				{Children.toArray(children)
					.filter((x) => x)
					.map((x, i) => (
						<Fragment key={i}>
							{i !== 0 && <HR className="my-2" />}
							<FocusGroup trapFocusLeft trapFocusRight scrollSnapAlign="center">
								{x}
							</FocusGroup>
						</Fragment>
					))}
			</View>
			{extra && (
				<FocusGroup trapFocusLeft trapFocusRight scrollSnapAlign="center">
					{extra}
				</FocusGroup>
			)}
		</Container>
	);
};

export const useSetting = <Setting extends keyof User["claims"]["settings"]>(
	setting: Setting,
) => {
	const account = useAccount();
	const { mutateAsync } = useMutation({
		method: "PATCH",
		path: ["auth", "users", "me"],
		compute: (update: Partial<User["claims"]["settings"]>) => ({
			body: {
				claims: {
					settings: { ...account!.claims.settings, ...update },
				},
			},
		}),
		optimistic: (update) => ({
			...account,
			claims: {
				...account!.claims,
				settings: { ...account!.claims.settings, ...update },
			},
		}),
		invalidate: ["auth", "users", "me"],
	});

	if (!account) return null;
	return [
		account.claims.settings[setting],
		async (value: User["claims"]["settings"][Setting]) => {
			await mutateAsync({ [setting]: value });
		},
	] as const;
};
