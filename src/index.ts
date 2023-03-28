import fetch from "node-fetch";
import dotenv from "dotenv";
import { load } from "cheerio";
import cron from "node-cron";
import { createClient } from "@supabase/supabase-js";

import { IJob } from "./interface";

dotenv.config();

// Get Supabase client credentials fron env
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

// Init Supabase
const supabase = createClient(SUPABASE_URL!, SUPABASE_KEY!);

// Function to fetch html
async function fetchPage(url: string) {
  const response = await fetch(url);
  const html = await response.text();
  return load(html);
}

// Define a function for scraping the web
async function scrapeJobs() {
  // fetch url
  const $ = await fetchPage("https://web3.career/");

  // Create an empty array variable; jobs
  const jobs: IJob[] = [];

  $("tr").each((_i, el) => {
    const image = $(el).find("img").attr("src");
    const company = $(el).find("h3").text();
    const title = $(el).find("h2").text();

    jobs.push({ company, title, image });
  });

  // Store the jobs in the Supabase database
  const { data, error } = await supabase.from("jobs").insert(jobs);

  if (error) {
    console.error(error);
  } else {
    console.log(`Inserted ${jobs.length} jobs`);
  }
}

scrapeJobs();

// Run the scraper every 24 hours
cron.schedule("0 0 * * *", () => {
  scrapeJobs();
});
