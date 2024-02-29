"use client";

import { useAutoAnimate } from "@formkit/auto-animate/react";
import { Fragment, useState } from "react";
import { z } from "zod";

import { WipeMyCalActionButton } from "@calcom/app-store/wipemycalother/components";
import { MeetLocationType } from "@calcom/core/location";
import dayjs from "@calcom/dayjs";
import ExportBookingsButton from "@calcom/features/bookings/components/ExportBookingsButton";
import { FilterToggle } from "@calcom/features/bookings/components/FilterToggle";
import { FiltersContainer } from "@calcom/features/bookings/components/FiltersContainer";
import type { filterQuerySchema } from "@calcom/features/bookings/lib/useFilterQuery";
import { useFilterQuery } from "@calcom/features/bookings/lib/useFilterQuery";
import { ShellMain } from "@calcom/features/shell/Shell";
import { formatTime } from "@calcom/lib/date-fns";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import { useParamsWithFallback } from "@calcom/lib/hooks/useParamsWithFallback";
import { BookingStatus } from "@calcom/prisma/client";
import type { RouterOutputs } from "@calcom/trpc/react";
import { trpc } from "@calcom/trpc/react";
import type { HorizontalTabItemProps, VerticalTabItemProps } from "@calcom/ui";
import { Alert, Button, EmptyScreen, HorizontalTabs } from "@calcom/ui";
import { Calendar } from "@calcom/ui/components/icon";

import { useInViewObserver } from "@lib/hooks/useInViewObserver";
import useMeQuery from "@lib/hooks/useMeQuery";

import BookingListItem from "@components/booking/BookingListItem";
import SkeletonLoader from "@components/booking/SkeletonLoader";

import { validStatuses } from "~/bookings/lib/validStatuses";

type BookingListingStatus = z.infer<NonNullable<typeof filterQuerySchema>>["status"];
type BookingOutput = RouterOutputs["viewer"]["bookings"]["get"]["bookings"][0];
type BookingListingByStatusType = "Unconfirmed" | "Cancelled" | "Recurring" | "Upcoming" | "Past";
type BookingExportType = BookingOutput & {
  type: BookingListingByStatusType;
  startDate: string;
  interval: string;
};

type RecurringInfo = {
  recurringEventId: string | null;
  count: number;
  firstDate: Date | null;
  bookings: { [key: string]: Date[] };
};

const tabs: (VerticalTabItemProps | HorizontalTabItemProps)[] = [
  {
    name: "upcoming",
    href: "/bookings/upcoming",
  },
  {
    name: "unconfirmed",
    href: "/bookings/unconfirmed",
  },
  {
    name: "recurring",
    href: "/bookings/recurring",
  },
  {
    name: "past",
    href: "/bookings/past",
  },
  {
    name: "cancelled",
    href: "/bookings/cancelled",
  },
];

const descriptionByStatus: Record<NonNullable<BookingListingStatus>, string> = {
  upcoming: "upcoming_bookings",
  recurring: "recurring_bookings",
  past: "past_bookings",
  cancelled: "cancelled_bookings",
  unconfirmed: "unconfirmed_bookings",
};

const querySchema = z.object({
  status: z.enum(validStatuses),
});

export default function Bookings() {
  const params = useParamsWithFallback();
  const { data: filterQuery } = useFilterQuery();
  const { status } = params ? querySchema.parse(params) : { status: "upcoming" as const };
  const {
    t,
    i18n: { language },
  } = useLocale();
  const user = useMeQuery().data;
  const [isFiltersVisible, setIsFiltersVisible] = useState<boolean>(false);

  const query = trpc.viewer.bookings.get.useInfiniteQuery(
    {
      limit: 10,
      filters: {
        ...filterQuery,
        status: filterQuery.status ?? status,
      },
    },
    {
      // first render has status `undefined`
      enabled: true,
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  );

  const allBookingsQuery = trpc.viewer.bookings.get.useInfiniteQuery(
    {
      limit: 10,
      filters: {},
    },
    {
      // first render has status `undefined`
      enabled: true,
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  );

  // Animate page (tab) transitions to look smoothing

  const buttonInView = useInViewObserver(() => {
    if (!query.isFetching && query.hasNextPage && query.status === "success") {
      query.fetchNextPage();
    }
  });

  // export bookings
  const handleExportBookings = async () => {
    let allBookings: BookingOutput[] = [];

    // Function to fetch all pages recursively
    const fetchAllBookings = async () => {
      const data = await allBookingsQuery.fetchNextPage();
      allBookings = allBookings.concat(data.data?.pages.map((page) => page.bookings).flat() ?? []);

      // Recursively fetching next page if available
      if (data.hasNextPage) {
        await fetchAllBookings();
      }
    };

    await fetchAllBookings();
    const allBookingsWithType: BookingExportType[] = [];

    allBookings.forEach((booking) => {
      let type: BookingListingByStatusType | null = null;
      let startDate = "";

      const endTime = new Date(booking.endTime);
      if (endTime >= new Date()) {
        if (booking.status === BookingStatus.PENDING) {
          type = "Unconfirmed";
        } else if (booking.status === BookingStatus.CANCELLED || booking.status === BookingStatus.REJECTED) {
          type = "Cancelled";
        } else if (booking.recurringEventId !== null) {
          type = "Recurring";
        } else {
          type = "Upcoming";
        }
        startDate = dayjs(booking.startTime).tz(user?.timeZone).locale(language).format("ddd, D MMM");
      } else {
        if (booking.status === BookingStatus.CANCELLED || booking.status === BookingStatus.REJECTED) {
          type = "Cancelled";
        } else {
          type = "Past";
        }
        startDate = dayjs(booking.startTime).tz(user?.timeZone).locale(language).format("D MMMM YYYY");
      }

      const interval = `${formatTime(booking.startTime, user?.timeFormat, user?.timeZone)} -
        ${formatTime(booking.endTime, user?.timeFormat, user?.timeZone)}`;

      allBookingsWithType.push({ ...booking, type, startDate, interval });
    });

    const header = [
      "ID",
      "Title",
      "Description",
      "Status",
      "Event",
      "Date",
      "Interval",
      "Location",
      "Attendees",
      "Paid",
      "Current",
      "Amount",
      "Payment Status",
      "Rescheduled",
      "Recurring Event ID",
      "Is Recorded",
    ];
    const csvData = allBookingsWithType.map((booking) => {
      return [
        booking.id,
        booking.title,
        booking.description,
        booking.type,
        booking.eventType.title ?? "",
        booking.startDate,
        booking.interval,
        booking.location === MeetLocationType ? "Google Meet" : booking.location ?? "",
        booking.attendees.map((attendee) => attendee.email).join(";"),
        booking.paid.toString(),
        booking.payment.map((pay) => pay.currency).join(";"),
        booking.payment.map((pay) => pay.amount).join(";"),
        booking.payment.map((pay) => pay.success).join(";"),
        booking.rescheduled?.toString() ?? "",
        booking.recurringEventId ?? "",
        booking.isRecorded.toString(),
      ];
    });

    const csvContent = [header.join(","), ...csvData.map((row) => row.join(","))].join("\n");

    const encodedUri = encodeURI(`data:text/csv;charset=utf-8,${csvContent}`);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "all-bookings.csv");
    document.body.appendChild(link);
    link.click();
  };

  const isEmpty = !query.data?.pages[0]?.bookings.length;

  const shownBookings: Record<string, BookingOutput[]> = {};
  const filterBookings = (booking: BookingOutput) => {
    if (status === "recurring" || status == "unconfirmed" || status === "cancelled") {
      if (!booking.recurringEventId) {
        return true;
      }
      if (
        shownBookings[booking.recurringEventId] !== undefined &&
        shownBookings[booking.recurringEventId].length > 0
      ) {
        shownBookings[booking.recurringEventId].push(booking);
        return false;
      }
      shownBookings[booking.recurringEventId] = [booking];
    } else if (status === "upcoming") {
      return (
        dayjs(booking.startTime).tz(user?.timeZone).format("YYYY-MM-DD") !==
        dayjs().tz(user?.timeZone).format("YYYY-MM-DD")
      );
    }
    return true;
  };

  let recurringInfoToday: RecurringInfo | undefined;

  const bookingsToday =
    query.data?.pages.map((page) =>
      page.bookings.filter((booking: BookingOutput) => {
        recurringInfoToday = page.recurringInfo.find(
          (info) => info.recurringEventId === booking.recurringEventId
        );

        return (
          dayjs(booking.startTime).tz(user?.timeZone).format("YYYY-MM-DD") ===
          dayjs().tz(user?.timeZone).format("YYYY-MM-DD")
        );
      })
    )[0] || [];

  const [animationParentRef] = useAutoAnimate<HTMLDivElement>();

  return (
    <ShellMain hideHeadingOnMobile heading={t("bookings")} subtitle={t("bookings_description")}>
      <div className="flex flex-col">
        <div className="flex flex-row flex-wrap justify-between">
          <HorizontalTabs tabs={tabs} />
          <div className="flex flex-wrap gap-2">
            <FilterToggle setIsFiltersVisible={setIsFiltersVisible} />
            <ExportBookingsButton handleExportBookings={handleExportBookings} />
          </div>
        </div>
        <FiltersContainer isFiltersVisible={isFiltersVisible} />
        <main className="w-full">
          <div className="flex w-full flex-col" ref={animationParentRef}>
            {query.status === "error" && (
              <Alert severity="error" title={t("something_went_wrong")} message={query.error.message} />
            )}
            {(query.status === "loading" || query.isPaused) && <SkeletonLoader />}
            {query.status === "success" && !isEmpty && (
              <>
                {!!bookingsToday.length && status === "upcoming" && (
                  <div className="mb-6 pt-2 xl:pt-0">
                    <WipeMyCalActionButton bookingStatus={status} bookingsEmpty={isEmpty} />
                    <p className="text-subtle mb-2 text-xs font-medium uppercase leading-4">{t("today")}</p>
                    <div className="border-subtle overflow-hidden rounded-md border">
                      <table className="w-full max-w-full table-fixed">
                        <tbody className="bg-default divide-subtle divide-y" data-testid="today-bookings">
                          <Fragment>
                            {bookingsToday.map((booking: BookingOutput) => (
                              <BookingListItem
                                key={booking.id}
                                loggedInUser={{
                                  userId: user?.id,
                                  userTimeZone: user?.timeZone,
                                  userTimeFormat: user?.timeFormat,
                                  userEmail: user?.email,
                                }}
                                listingStatus={status}
                                recurringInfo={recurringInfoToday}
                                {...booking}
                              />
                            ))}
                          </Fragment>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                <div className="pt-2 xl:pt-0">
                  <div className="border-subtle overflow-hidden rounded-md border">
                    <table data-testid={`${status}-bookings`} className="w-full max-w-full table-fixed">
                      <tbody className="bg-default divide-subtle divide-y" data-testid="bookings">
                        {query.data.pages.map((page, index) => (
                          <Fragment key={index}>
                            {page.bookings.filter(filterBookings).map((booking: BookingOutput) => {
                              const recurringInfo = page.recurringInfo.find(
                                (info) => info.recurringEventId === booking.recurringEventId
                              );
                              return (
                                <BookingListItem
                                  key={booking.id}
                                  loggedInUser={{
                                    userId: user?.id,
                                    userTimeZone: user?.timeZone,
                                    userTimeFormat: user?.timeFormat,
                                    userEmail: user?.email,
                                  }}
                                  listingStatus={status}
                                  recurringInfo={recurringInfo}
                                  {...booking}
                                />
                              );
                            })}
                          </Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="text-default p-4 text-center" ref={buttonInView.ref}>
                    <Button
                      color="minimal"
                      loading={query.isFetchingNextPage}
                      disabled={!query.hasNextPage}
                      onClick={() => query.fetchNextPage()}>
                      {query.hasNextPage ? t("load_more_results") : t("no_more_results")}
                    </Button>
                  </div>
                </div>
              </>
            )}
            {query.status === "success" && isEmpty && (
              <div className="flex items-center justify-center pt-2 xl:pt-0">
                <EmptyScreen
                  Icon={Calendar}
                  headline={t("no_status_bookings_yet", { status: t(status).toLowerCase() })}
                  description={t("no_status_bookings_yet_description", {
                    status: t(status).toLowerCase(),
                    description: t(descriptionByStatus[status]),
                  })}
                />
              </div>
            )}
          </div>
        </main>
      </div>
    </ShellMain>
  );
}
