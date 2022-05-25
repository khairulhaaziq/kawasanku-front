import type {
  GetStaticPaths,
  GetStaticProps,
  InferGetStaticPropsType,
  NextPage,
} from "next";
import { useState } from "react";
import dynamic from "next/dynamic";
import { ParsedUrlQuery } from "querystring";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

// TODO: remove after getting actual mapping from backend
import mappingJson from "../../data/json/mapping.json";
import { getSnapshot, getStateGeojson, getStatePaths } from "../../lib/api";

import Card from "../../components/Card";
import Container from "../../components/Container";
import Spotlight from "../../components/Spotlight";
import Introduction from "../../components/Introduction";
import { Option } from "../../components/Dropdowns/interface";
import { translateDoughnutChart } from "../../lib/helpers";

const BarChart = dynamic(() => import("../../components/Charts/BarChart"), {
  ssr: false,
});
const DoughnutChart = dynamic(
  () => import("../../components/Charts/DoughnutCharts"),
  { ssr: false }
);
const JitterPlots = dynamic(() => import("../../components/JitterPlots"), {
  ssr: false,
});

const State: NextPage = ({
  state_key,
  state,
  areaType,
  area,
  mapping,
  barChartData,
  sex,
  ethnicity,
  religion,
  maritalStatus,
  ageGroup,
  jitterplotData,
}: InferGetStaticPropsType<typeof getStaticProps>) => {
  const { t } = useTranslation();

  const [jitterComparisons, setJitterComparisons] = useState<Option[]>([]);

  return (
    <>
      <Introduction
        state_key={state_key}
        state={state}
        areaType={areaType}
        area={area}
        mapping={mapping}
      />
      {/* CHARTS */}
      <Container
        backgroundColor="bg-gray-100"
        className="flex flex-col px-4 pt-5 md:pt-14 lg:px-0"
      >
        {/* BAR CHART TITLE */}
        <div className="mb-5 flex w-full flex-col items-start justify-between gap-2 md:mb-7 md:flex-row md:items-center md:gap-0">
          <h3 className="section-title">{t("section1_title")}</h3>
          <p className="text-sm text-gray-400">{t("census_2020")}</p>
        </div>
        <div className="mb-10 flex w-full flex-col gap-4 md:mb-15 md:flex-row">
          {/* BAR CHART */}
          <div className="w-full md:w-1/3">
            <Card className="border">
              <BarChart data={barChartData} />
            </Card>
          </div>
          {/* DOUGHNUT CHARTS */}
          <div className="grid w-full grid-cols-1 overflow-hidden rounded-lg border md:w-2/3 md:grid-cols-3 md:grid-rows-2">
            <DoughnutChart title={t("doughnut.metric_1")} data={sex} />
            <DoughnutChart title={t("doughnut.metric_2")} data={ethnicity} />
            {/* TODO: add nationality data */}
            <DoughnutChart title={t("doughnut.metric_5")} data={religion} />
            <DoughnutChart
              title={t("doughnut.metric_6")}
              data={maritalStatus}
            />
            <DoughnutChart title={t("doughnut.metric_4")} data={ageGroup} />
            <DoughnutChart title={t("doughnut.metric_4")} data={ageGroup} />
          </div>
        </div>
        {/* JITTERPLOT TITLE */}
        <div className="mb-6 flex w-full flex-col items-start justify-between gap-2 md:mb-7 md:flex-row md:items-center md:gap-0">
          <h3 className="section-title">{t("section2_title")}</h3>
          <p className="text-sm text-gray-400">{t("census_2020")}</p>
        </div>
      </Container>
      <Container
        backgroundColor="bg-white md:bg-gray-100"
        className="pb-5 md:pb-8"
      >
        <Card className="relative md:border">
          {/* SPOTLIGHT */}
          <Spotlight
            // TODO: set current location based on location returned from backend
            currentLocation={{ label: "Ipoh", value: "Ipoh" }}
            jitterComparisons={jitterComparisons}
            setJitterComparisons={setJitterComparisons}
          />
          {/* JITTERPLOTS */}
          <JitterPlots data={jitterplotData} comparisons={jitterComparisons} />
        </Card>
      </Container>
    </>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  const statePaths = await getStatePaths();
  const paths = statePaths.map((state) => {
    // state returned as "/state"
    return { params: { state: state.substring(1) } };
  });

  return { paths, fallback: false };
};

interface IParams extends ParsedUrlQuery {
  state: string;
}

export const getStaticProps: GetStaticProps = async ({ params, locale }) => {
  const { state } = params as IParams;

  const translationReq = serverSideTranslations(locale!);
  const geoReq = getStateGeojson(state);
  const snapshotReq = getSnapshot({ state });

  const res = await Promise.all([translationReq, geoReq, snapshotReq]);

  // TRANSLATION
  const translation = res[0];
  const translationStore =
    translation._nextI18Next.initialI18nStore[locale!]["common"];

  // SNAPSHOT DATA
  const snapshot = res[2].doughnut_charts as any;
  const sex = snapshot[0].sex;
  const ethnicity = snapshot[1].ethnicity;
  const religion = snapshot[2].religion;
  const maritalStatus = snapshot[4].marital;
  const ageGroup = snapshot[5].agegroup;

  // TRANSLATED SNAPSHOT DATA
  const translatedSex = translateDoughnutChart(translationStore, sex);
  const translatedEthnicity = translateDoughnutChart(
    translationStore,
    ethnicity
  );
  const translatedReligion = translateDoughnutChart(translationStore, religion);
  const translatedMaritalStatus = translateDoughnutChart(
    translationStore,
    maritalStatus
  );
  const translatedAgeGroup = translateDoughnutChart(translationStore, ageGroup);

  const mappingData = mappingJson;

  const geoFilterSelection = {
    state_key: state,
    state: "",
    areaType: "",
    area: "",
  };

  const barChartData = [
    {
      country: "AD",
      fries: 50,
      burger: 60,
      sandwich: -60,
      kebab: -50,
    },
    {
      country: "AC",
      fries: 40,
      burger: 50,
      sandwich: -50,
      kebab: -40,
    },
    {
      country: "AB",
      fries: 30,
      burger: 40,
      sandwich: -40,
      kebab: -30,
    },

    {
      country: "AA",
      fries: 20,
      burger: 30,
      sandwich: -30,
      kebab: -20,
    },
  ];

  const jitterplotArr = Array(100)
    .fill(0)
    .map((_, index) => {
      return {
        id: `Area ${index}`,
        data: [
          {
            x: Math.random() * (Math.random() > 0.5 ? 1 : -1),
            y: Math.random(),
          },
        ],
      };
    });

  let jitterplotData: { [key: string]: any } = {};
  Array(27)
    .fill(0)
    .forEach((_, index) => {
      jitterplotData[`metric_${index + 1}`] = jitterplotArr;
    });

  return {
    props: {
      state_key: geoFilterSelection.state_key,
      state: geoFilterSelection.state,
      areaType: geoFilterSelection.areaType,
      area: geoFilterSelection.area,
      mapping: mappingData,
      barChartData,
      // SNAPSHOT DATA
      sex: translatedSex,
      ethnicity: translatedEthnicity,
      religion: translatedReligion,
      maritalStatus: translatedMaritalStatus,
      ageGroup: translatedAgeGroup,
      jitterplotData,
      ...(locale && (await serverSideTranslations(locale, ["common"]))),
    },
  };
};

export default State;
