import { ScrollView, RefreshControl, View } from "react-native";
import { designTokens } from "../../../design/tokens";
import { useRefresh } from "~/query";
import { Header as FeaturedHeader } from "./header";
import { NextupList } from "./nextup";
import { NewsList } from "./news";
import { ShelfList } from "./shelf";

export const HomePage = () => {
	const [isRefreshing, refresh] = useRefresh(HomePage.queries());
	return (
		<ScrollView
			className="flex-1 bg-background"
			focusable={false}
			showsVerticalScrollIndicator={false}
			refreshControl={
				<RefreshControl
					refreshing={isRefreshing}
					onRefresh={refresh}
					tintColor={designTokens.colors.accent}
					colors={[designTokens.colors.accent]}
				/>
			}
			contentContainerStyle={{ paddingBottom: 84 }}
		>
			<FeaturedHeader />
			<View className="mx-3 mt-9 gap-10 sm:mx-8 sm:mt-12 lg:mx-14">
				<NextupList />
				<ShelfList />
				<NewsList />
			</View>
		</ScrollView>
	);
};

HomePage.queries = () => [
	FeaturedHeader.query(),
	NextupList.query(),
	ShelfList.seriesQuery(),
	ShelfList.moviesQuery(),
	NewsList.query(),
];
