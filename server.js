const express = require("express");
const cors = require("cors");
const axios = require("axios");
const iconv = require("iconv-lite");
const { parse } = require("csv-parse/sync");

const app = express();
const port = 3002;

app.use(cors());

app.get("/jepx/latest", async (req, res) => {
  try {
    const year = new Date().getFullYear();
    const url = `https://www.jepx.jp/market/excel/spot_${year}.csv`;

    const response = await axios.get(url, { responseType: "arraybuffer" });
    const csvText = iconv.decode(Buffer.from(response.data), "Shift_JIS");

    const records = parse(csvText, {
      columns: true,
      skip_empty_lines: true,
    });

    const latestDate = records[records.length - 1]["年月日"];
    const todayRecords = records.filter((r) => r["年月日"] === latestDate);

    const labels = todayRecords.map((r) => {
      const slot = Number(r["時刻コード"]);
      const hour = Math.floor((slot - 1) / 2);
      const minute = slot % 2 === 1 ? "00" : "30";
      return `${hour}:${minute}`;
    });

    const latest = todayRecords[todayRecords.length - 1];

    const getData = (key) => todayRecords.map((r) => Number(r[key]));

    res.json({
      date: latestDate,
      slot: latest["時刻コード"],

      systemPrice: Number(latest["システムプライス(円/kWh)"]),
      hokkaidoPrice: Number(latest["エリアプライス北海道(円/kWh)"]),
      tohokuPrice: Number(latest["エリアプライス東北(円/kWh)"]),
      tokyoPrice: Number(latest["エリアプライス東京(円/kWh)"]),
      chubuPrice: Number(latest["エリアプライス中部(円/kWh)"]),
      hokurikuPrice: Number(latest["エリアプライス北陸(円/kWh)"]),
      kansaiPrice: Number(latest["エリアプライス関西(円/kWh)"]),
      chugokuPrice: Number(latest["エリアプライス中国(円/kWh)"]),
      shikokuPrice: Number(latest["エリアプライス四国(円/kWh)"]),
      kyushuPrice: Number(latest["エリアプライス九州(円/kWh)"]),

      labels,
      systemPriceData: getData("システムプライス(円/kWh)"),
      tokyoPriceData: getData("エリアプライス東京(円/kWh)"),
      kansaiPriceData: getData("エリアプライス関西(円/kWh)"),
      kyushuPriceData: getData("エリアプライス九州(円/kWh)"),

      areaPrices: [
        { name: "北海道", price: Number(latest["エリアプライス北海道(円/kWh)"]) },
        { name: "東北", price: Number(latest["エリアプライス東北(円/kWh)"]) },
        { name: "東京", price: Number(latest["エリアプライス東京(円/kWh)"]) },
        { name: "中部", price: Number(latest["エリアプライス中部(円/kWh)"]) },
        { name: "北陸", price: Number(latest["エリアプライス北陸(円/kWh)"]) },
        { name: "関西", price: Number(latest["エリアプライス関西(円/kWh)"]) },
        { name: "中国", price: Number(latest["エリアプライス中国(円/kWh)"]) },
        { name: "四国", price: Number(latest["エリアプライス四国(円/kWh)"]) },
        { name: "九州", price: Number(latest["エリアプライス九州(円/kWh)"]) },
      ],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "JEPXデータ取得に失敗しました" });
  }
});

app.listen(port, () => {
  console.log(`GridScope API is running at http://localhost:${port}`);
});