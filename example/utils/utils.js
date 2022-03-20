import { shiftDate, getBeginningTimeForDate, convertToDate } from "./helpers";
import {
  SQUARE_SIZE,
  MONTH_LABELS,
  DAYS_IN_WEEK,
  MONTH_LABEL_GUTTER_SIZE,
  MILLISECONDS_IN_ONE_DAY,
} from "./constants";

function getTransformForMonthLabels(horizontal, gutterSize) {
  if (horizontal) {
    return null;
  }
  return `${getWeekWidth(gutterSize) + MONTH_LABEL_GUTTER_SIZE}, 0`;
}

function getTransformForAllWeeks(showMonthLabels, horizontal) {
  if (horizontal)
    return `0, ${getMonthLabelSize(showMonthLabels, horizontal) - 100}`;
  return null;
}

function getWeekWidth(gutterSize) {
  return DAYS_IN_WEEK * getSquareSizeWithGutter(gutterSize);
}

function getWidth(startDate, endDate, gutterSize) {
  return (
    getDateCount(startDate, endDate) * getSquareSizeWithGutter(gutterSize) -
    gutterSize +
    30
  );
}

function getHeight(gutterSize, showMonthLabels, horizontal) {
  return (
    getWeekWidth(gutterSize) +
    (getMonthLabelSize(showMonthLabels, horizontal) - gutterSize)
  );
}

function getViewBox(numDays, endDate, gutterSize, showMonthLabels, horizontal) {
  if (horizontal) {
    return `${getWidth(numDays, endDate, gutterSize)} ${getHeight(
      gutterSize,
      showMonthLabels,
      horizontal
    )}`;
  }
  return `${getHeight(gutterSize, showMonthLabels, horizontal)} ${getWidth(
    numDays,
    endDate,
    gutterSize
  )}`;
}

function getValueForIndex(index, valueCache) {
  if (valueCache[index]) return valueCache[index].value;
  return null;
}

function getTooltipDataAttrsForValue(value, tooltipDataAttrs) {
  if (typeof tooltipDataAttrs === "function") return tooltipDataAttrs(value);
  return tooltipDataAttrs;
}

function getTooltipDataAttrsForIndex(index, valueCache, tooltipDataAttrs) {
  if (valueCache[index]) {
    return valueCache[index].tooltipDataAttrs;
  }
  return getTooltipDataAttrsForValue(
    { date: null, count: null },
    tooltipDataAttrs
  );
}

const getCountByDuplicateValues = (array) => {
  // {
  //   datetime: 1647475517,
  //   "molhamento-foliar": 5,
  // },
  const formatedArray = [];
  array.map((item) => {
    for (let sum = 0; sum < item["molhamento-foliar"]; sum++) {
      const shouldAddDay =
        new Date(item.datetime).getHours() + sum > 24 ? true : false;

      const hour = shouldAddDay
        ? new Date(item.datetime).getHours() + sum - 24
        : new Date(item.datetime).getHours() + sum;
      const date = shouldAddDay
        ? new Date(item.datetime + 60 * 60 * 24 * 1000).toLocaleDateString({
            day: "numeric",
          })
        : new Date(item.datetime).toLocaleDateString({
            day: "numeric",
          });

      formatedArray.push({
        date,
        hour,
        shouldAddDay,
      });
    }
  });
  console.log("formatedArray", formatedArray);
  let hashMap = {};

  for (let item of formatedArray) {
    //if that date exists
    if (item.date in hashMap) {
      //up the prev count
      hashMap[item.date] = hashMap[item.date] + 1;
    } else {
      hashMap[item.date] = 1;
    }
  }

  //now we will iterate through those keys of the Map and format it for Array 2
  let outputArray = [];
  Object.keys(hashMap).forEach((key) => {
    outputArray.push({
      key,
      count: hashMap[key],
    });
  });
  return outputArray;
};

function findColorLevel(count, rectColor) {
  if (count === 0) return rectColor[0];
  else if (count >= 1 && count <= 3) return rectColor[1];
  else if (count >= 4 && count <= 9) return rectColor[2];
  else if (count >= 10 && count <= 17) return rectColor[3];
  else if (count >= 18 && count <= 25) return rectColor[4];
  else if (count >= 26) return rectColor[5];
  else return rectColor[5];
}

function getFillColor(index, valueCache, rectColor) {
  if (valueCache[index]) {
    const fillColor = findColorLevel(
      valueCache[index].countedArray.count,
      rectColor
    );
    return fillColor;
  }
  return rectColor[0];
}

function getTitleForIndex(index, valueCache, titleForValue) {
  if (valueCache[index]) return valueCache[index].title;
  return titleForValue ? titleForValue(null) : null;
}

function getSquareCoordinates(dayIndex, horizontal, gutterSize) {
  if (horizontal) return [0, dayIndex * getSquareSizeWithGutter(gutterSize)];
  return [dayIndex * getSquareSizeWithGutter(gutterSize), 0];
}

function getTransformForWeek(
  weekIndex,
  horizontal,
  gutterSize,
  showMonthLabels
) {
  if (horizontal) {
    return [
      weekIndex * getSquareSizeWithGutter(gutterSize),
      getMonthLabelSize(showMonthLabels, horizontal),
    ];
  }
  if (horizontal && !showMonthLabels) {
    return [weekIndex * getSquareSizeWithGutter(gutterSize), 0];
  }
  return [10, weekIndex * getSquareSizeWithGutter(gutterSize)];
}

function getMonthLabelSize(showMonthLabels, horizontal) {
  if (!showMonthLabels) {
    return 0;
  } else if (horizontal) {
    return SQUARE_SIZE + MONTH_LABEL_GUTTER_SIZE;
  }
  return 2 * (SQUARE_SIZE + MONTH_LABEL_GUTTER_SIZE);
}

function getSquareSizeWithGutter(gutterSize) {
  return SQUARE_SIZE + gutterSize;
}

function getMonthLabelCoordinates(weekIndex, horizontal, gutterSize) {
  if (horizontal) {
    return [weekIndex * getSquareSizeWithGutter(gutterSize), 0];
  }
  const verticalOffset = -2;
  return [
    0,
    (weekIndex + 1) * getSquareSizeWithGutter(gutterSize) + verticalOffset,
  ];
}

function getStartDateWithEmptyDays(numDays, endDate) {
  return shiftDate(
    getStartDate(numDays, endDate),
    -getNumEmptyDaysAtStart(numDays, endDate)
  );
}

function getEndDate(endDate) {
  return getBeginningTimeForDate(convertToDate(endDate));
}

function getStartDate(numDays, endDate) {
  return shiftDate(getEndDate(endDate), -numDays + 1); // +1 because endDate is inclusive
}

function getNumEmptyDaysAtEnd(endDate) {
  return DAYS_IN_WEEK - 1 - getEndDate(endDate).getDay();
}

function getNumEmptyDaysAtStart(numDays, endDate) {
  return getStartDate(numDays, endDate).getDay();
}

function getWeekCount(numDays, endDate) {
  const numDaysRoundedToWeek =
    numDays +
    getNumEmptyDaysAtStart(numDays, endDate) +
    getNumEmptyDaysAtEnd(endDate);
  return Math.ceil(numDaysRoundedToWeek / DAYS_IN_WEEK);
}

function getDateCount(startDate, endDate) {
  const rangeInMilliseconds = endDate.getTime() - startDate.getTime();
  return rangeInMilliseconds / MILLISECONDS_IN_ONE_DAY;
}

function getLabelDay(startDate, index) {
  let currentDate = new Date(startDate);
  currentDate.setDate(currentDate.getDate() + index + 1);
  const day = currentDate.getDate();
  const month = currentDate.getMonth() + 1;

  return `${day}/${month}`;
}

export {
  getWeekCount,
  getStartDateWithEmptyDays,
  getMonthLabelCoordinates,
  getTransformForWeek,
  getNumEmptyDaysAtStart,
  getSquareCoordinates,
  getTitleForIndex,
  getFillColor,
  getCountByDuplicateValues,
  getTooltipDataAttrsForIndex,
  getTooltipDataAttrsForValue,
  getHeight,
  getWidth,
  getDateCount,
  getLabelDay,
};

export default {
  getWeekCount,
  getStartDateWithEmptyDays,
  getMonthLabelCoordinates,
  getTransformForWeek,
  getNumEmptyDaysAtStart,
  getSquareCoordinates,
  getTitleForIndex,
  getFillColor,
  getCountByDuplicateValues,
  getTooltipDataAttrsForIndex,
  getTooltipDataAttrsForValue,
  getHeight,
  getWidth,
  getDateCount,
  getLabelDay,
};
