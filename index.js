import "dotenv/config";
import express from "express";
import axios from "axios";

const app = express();

app.use(express.json());

app.post("/", async (req, res) => {
  const imageResponse = await axios({
    method: "GET",
    responseType: "arraybuffer",
    url: req.body.url,
  });

  const base64Encoded = Buffer.from(imageResponse.data).toString("base64");
  const base64Prepended = `data:image/jpg;base64,${base64Encoded}`;

  const response = await axios({
    method: "POST",
    url: "https://plant.id/api/v3/identification",
    headers: {
      "Api-Key": process.env.PLANT_ID_API_KEY,
    },
    data: {
      images: [base64Prepended],
    },
  });

  const { name, probability } =
    response.data.result.classification.suggestions[0];

  if (probability < 0.1) {
    return res.send({
      error: "The image you have provided does not have any plant in it",
    });
  }

  res.send({
    name,
    probability,
    wikipediaLink: `https://en.wikipedia.org/wiki/${encodeURIComponent(name)}`,
  });
});

app.get("/", async (req, res) => {
  res.send({
    name: "classify_plant",
    description: "Identify the plant from an image",
    parameters: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description: "The image url of the plant",
        },
      },
      required: ["url"],
    },
  });
});

app.listen(process.env.PORT, () => {
  console.log(`Example app listening on port ${process.env.PORT}`);
});
