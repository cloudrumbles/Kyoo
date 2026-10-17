import Admin from "@material-symbols/svg-400/rounded/admin_panel_settings.svg";
import Register from "@material-symbols/svg-400/rounded/app_registration.svg";
import Browse from "@material-symbols/svg-400/rounded/browse-fill.svg";
import Close from "@material-symbols/svg-400/rounded/close.svg";
import Login from "@material-symbols/svg-400/rounded/login.svg";
import Logout from "@material-symbols/svg-400/rounded/logout.svg";
import Person from "@material-symbols/svg-400/rounded/person-fill.svg";
import Play from "@material-symbols/svg-400/rounded/play_arrow-fill.svg";
import Search from "@material-symbols/svg-400/rounded/search-fill.svg";
import Settings from "@material-symbols/svg-400/rounded/settings.svg";
import { useNavigation, usePathname, useRouter } from "expo-router";
import { useIsFocused } from "expo-router/react-navigation";
import {
	type ComponentProps,
	type ComponentType,
	type Ref,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import { useTranslation } from "react-i18next";
import {
	Platform,
	type PressableProps,
	Text,
	TextInput,
	type TextInputProps,
	View,
	type ViewProps,
} from "react-native";
import Animated, {
	interpolate,
	type SharedValue,
	useAnimatedScrollHandler,
	useAnimatedStyle,
	useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCSSVariable } from "uniwind";
import {
	A,
	Avatar,
	HR,
	Icon,
	IconButton,
	Link,
	Menu,
	PressableFeedback,
	tooltip,
} from "~/primitives";
import { useAccount, useAccounts } from "~/providers/account-context";
import { logout } from "~/ui/login/logic";
import { CastButton } from "~/ui/player/controls/misc";
import { cn, useQueryState } from "~/utils";

export const NavbarLeft = () => {
	const { t } = useTranslation();
	const account = useAccount();

	if (Platform.OS !== "web") return <NavbarTitle />;

	return (
		<View className="flex-row items-center gap-5 lg:gap-8">
			<NavbarTitle />
			<NavbarLink href="/browse" label="Shelves" icon={Browse} />
			<NavbarLink
				href="/profiles/me"
				label="My list"
				icon={Person}
				className="max-sm:hidden"
			/>
			{account?.isAdmin && (
				<View className="max-sm:hidden">
					<Menu Trigger={NavbarLink} label={t("navbar.admin")} icon={Admin}>
					<Menu.Item
						label={t("admin.unmatched.label")}
						icon={Search}
						href="/admin/unmatched"
					/>
					<Menu.Item
						label={t("admin.streams.title")}
						icon={Play}
						href="/admin/streams"
					/>
					<Menu.Item label="Users" icon={Admin} href="/admin/users" />
					</Menu>
				</View>
			)}
		</View>
	);
};

const NavbarLink = <AsProps = ComponentProps<typeof A>>({
	as,
	label,
	icon,
	...props
}: {
	as?: ComponentType<AsProps>;
	label: string;
	icon: ComponentProps<typeof Icon>["icon"];
} & AsProps) => {
	const As = as ?? A;
	return (
		<As
			aria-label={label}
			className="items-center justify-center rounded-sm px-0.5 py-2"
			{...tooltip(label)}
			{...(props as any)}
		>
			<Icon
				icon={icon}
				className="fill-[#e9d9b8] md:hidden dark:fill-[#e9d9b8]"
			/>
			<Text className="font-sans text-[10px] text-[#dbe4eb] md:hidden dark:text-[#dbe4eb]">{label}</Text>
			<Text className="font-sans text-sm font-semibold text-[#dbe4eb] max-md:hidden dark:text-[#dbe4eb]">
				{label}
			</Text>
		</As>
	);
};

export const NavbarTitle = ({
	className,
	...props
}: Partial<ComponentProps<typeof Link>>) => {
	const { t } = useTranslation();

	return (
		<Link
			href="/"
			aria-label={t("navbar.home")}
			className={cn("video-nav-brand mr-1 flex-row items-center gap-1.5 rounded-sm py-1", className)}
			{...tooltip(t("navbar.home"))}
			{...props}
		>
			<View className="mr-1 h-7 w-7 items-center justify-center rounded-full border-2 border-[#f0c875]">
				<View className="h-2 w-2 rounded-full bg-[#f0c875]" />
			</View>
			<Text className="font-headers text-[31px] leading-8 font-extrabold text-[#f5efe1]">
				kyoo
			</Text>
			<Text className="font-headers text-[27px] leading-8 font-bold text-[#f0c875]">
				video
			</Text>
		</Link>
	);
};

export const NavbarRight = () => {
	const router = useRouter();
	const path = usePathname();
	const [q, setQuery] = useQueryState<string | undefined>("q", undefined);

	return (
		<View className="shrink flex-row items-center">
			<SearchBar
				key={path}
				overlayOnSmallScreen
				value={path === "/browse" ? q : undefined}
				onChangeText={(query) => {
					if (path === "/browse") {
						setQuery(query ?? undefined);
					}
				}}
				onSubmitEditing={(e) => {
					const query = e.nativeEvent.text;
					if (query && path !== "/browse") {
						router.push(`/browse?q=${query}`);
					}
				}}
			/>
			{Platform.OS !== "web" && (
				<CastButton iconClassName="fill-slate-200 dark:fill-slate-200" />
			)}
			<NavbarProfile />
		</View>
	);
};

export const SearchBar = ({
	value,
	onChangeText,
	onSubmitEditing,
	onBlur,
	onFocus,
	className,
	containerClassName,
	forceExpand,
	overlayOnSmallScreen,
	ref,
	...props
}: TextInputProps & {
	forceExpand?: boolean;
	containerClassName?: string;
	overlayOnSmallScreen?: boolean;
	ref?: Ref<TextInput>;
}) => {
	const { t } = useTranslation();
	const [_expanded, setExpanded] = useState(!!value);
	const [focused, setFocused] = useState(false);
	const inputRef = useRef<TextInput>(null);

	const expanded = _expanded || forceExpand;

	return (
		<Animated.View
			className={cn(
				"mr-2 flex-row items-center overflow-hidden rounded-sm p-0 pl-3",
				"ring-accent focus-within:ring-3",
				focused && "ring-3",
				expanded ? "bg-[#f0ebe2] dark:bg-[#f0ebe2]" : "bg-transparent",
				Platform.OS === "web" &&
					overlayOnSmallScreen &&
					expanded &&
					"max-sm:fixed max-sm:top-2 max-sm:right-1 max-sm:left-1 max-sm:z-50 max-sm:mr-0",
				containerClassName,
			)}
			style={[
				expanded ? { flex: 1 } : { flex: Platform.OS === "web" ? 1 : 0 },
				{
					transitionProperty: "backgroundColor",
					transitionDuration: "300ms",
				},
			]}
		>
			<TextInput
				ref={(view) => {
					inputRef.current = view;
					if (typeof ref === "function") ref(view);
					else if (ref) ref.current = view;
				}}
				value={value}
				onChangeText={(q) => onChangeText?.(q)}
				onSubmitEditing={(e) => onSubmitEditing?.(e)}
				onFocus={(e) => {
					onFocus?.(e);
					setExpanded(true);
					setFocused(true);
				}}
				onBlur={(e) => {
					onBlur?.(e);
					if (!value) setExpanded(false);
					setFocused(false);
				}}
				placeholder={t("navbar.search")}
				textAlignVertical="center"
				className={cn(
					"h-full min-w-0 flex-1 font-sans text-base outline-0",
					"align-middle text-[#101d30] dark:text-[#101d30]",
					!expanded && "w-0 grow-0",
					className,
				)}
				verticalAlign="middle"
				// @ts-expect-error not yet in typescript i think
				includeFontPadding={false}
				placeholderTextColorClassName="accent-slate-400 dark:text-slate-600"
				{...props}
			/>

			<IconButton
				icon={expanded ? Close : Search}
				// need to use onPressIn due to:
				//  https://github.com/react-navigation/react-navigation/issues/12274
				//  https://github.com/react-navigation/react-navigation/issues/12667
				onPressIn={() => {
					if (expanded) {
						inputRef.current?.blur();
						inputRef.current?.clear();
						onChangeText?.("");
						setExpanded(false);
					} else {
						setExpanded(true);
						// Small delay to allow animation to start before focusing
						setTimeout(() => inputRef.current?.focus(), 200);
					}
				}}
				iconClassName={cn(
					expanded
						? "fill-slate-500 dark:fill-slate-500"
						: "fill-slate-200 dark:fill-slate-200",
				)}
				{...tooltip(t("navbar.search"))}
			/>
		</Animated.View>
	);
};

export const getDisplayUrl = (url: string) => {
	url = url.replace(/\/api$/, "");
	url = url.replace(/https?:\/\//, "");
	return url;
};

export const NavbarProfile = () => {
	const { t } = useTranslation();
	const account = useAccount();
	const accounts = useAccounts();

	return (
		<Menu
			Trigger={Avatar<PressableProps>}
			as={PressableFeedback}
			account={account?.token ? account : undefined}
			placeholder={account?.username}
			alt={t("navbar.login")}
			className="m-2"
			{...tooltip(account?.username ?? t("navbar.login"))}
		>
			{accounts?.map((x) => (
				<Menu.Item
					key={x.id}
					label={
						Platform.OS === "web"
							? x.username
							: `${x.username} - ${getDisplayUrl(x.apiUrl)}`
					}
					left={<Avatar placeholder={x.username} account={x} />}
					selected={x.selected}
					onSelect={() => x.select()}
				/>
			))}
			{accounts.length > 0 && <HR />}
			<Menu.Item label="My list" icon={Person} href="/profiles/me" />
			<Menu.Item label={t("misc.settings")} icon={Settings} href="/settings" />
			{account?.isAdmin && (
				<>
					<HR />
					<Menu.Item label={t("admin.unmatched.label")} icon={Browse} href="/admin/unmatched" />
					<Menu.Item label={t("admin.streams.title")} icon={Play} href="/admin/streams" />
					<Menu.Item label="Users" icon={Admin} href="/admin/users" />
				</>
			)}
			{!account ? (
				<>
					<Menu.Item label={t("login.login")} icon={Login} href="/login" />
					<Menu.Item
						label={t("login.register")}
						icon={Register}
						href="/register"
					/>
				</>
			) : (
				<>
					<Menu.Item
						label={t("login.add-account")}
						icon={Login}
						href="/login"
					/>
					<Menu.Item
						label={t("login.logout")}
						icon={Logout}
						onSelect={() => logout()}
					/>
				</>
			)}
		</Menu>
	);
};

export const useScrollNavbar = ({
	imageHeight,
	tab = false,
}: {
	imageHeight: number | SharedValue<number>;
	tab?: boolean;
}) => {
	const insets = useSafeAreaInsets();
	const height = Platform.isTV
		? 0
		: insets.top + (Platform.OS === "ios" ? 44 : 56);

	const scrollY = useSharedValue(0);
	const scrollHandler = useAnimatedScrollHandler((event) => {
		scrollY.value = event.contentOffset.y;
	});
	const opacity = useAnimatedStyle(() => {
		const ih =
			typeof imageHeight === "number" ? imageHeight : imageHeight.value;
		return {
			opacity: interpolate(scrollY.value, [0, ih - height], [0, 1]),
		};
	}, [imageHeight, height]);
	const reverse = useAnimatedStyle(() => {
		const ih =
			typeof imageHeight === "number" ? imageHeight : imageHeight.value;
		return {
			opacity: interpolate(scrollY.value, [0, ih - height], [1, 0]),
		};
	}, [imageHeight, height]);

	const nav = useNavigation();
	const focused = useIsFocused();
	const accent = useCSSVariable("--color-background");
	useLayoutEffect(() => {
		const n = tab ? nav.getParent() : nav;
		if (focused) {
			n?.setOptions({
				headerTransparent: true,
				headerStyle: { backgroundColor: "transparent" },
			});
		}
		return () =>
			n?.setOptions({
				headerTransparent: false,
				headerStyle: { backgroundColor: accent as string },
			});
	}, [nav, tab, focused, accent]);

	return {
		scrollHandler,
		headerProps: {
			opacity,
			reverse,
			height,
			focused,
		},
		headerHeight: height,
	};
};

export const HeaderBackground = ({
	children,
	opacity,
	reverse,
	height,
	focused,
	className,
	style,
	...props
}: ViewProps & ReturnType<typeof useScrollNavbar>["headerProps"]) => {
	// this is to handle transparent modals, to prevent duplicated header bar.
	if (Platform.isTV || !focused) return null;
	return (
		<>
			<Animated.View
				className={cn("absolute z-10 w-full bg-[#101d30]", className)}
				style={[{ height }, opacity, style]}
				{...props}
			/>
			<Animated.View
				className={cn(
					"absolute z-10 w-full bg-linear-to-b from-slate-950/70 to-transparent",
					className,
				)}
				style={[{ height }, reverse, style]}
				{...props}
			/>
			{children}
		</>
	);
};
