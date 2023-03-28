import dotenv from "dotenv";
import fetch from "node-fetch";
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

/**
 *
 * @description - Google search query for "web3 jobs". Here's a breakdown of the URL parameters:
 *                q=web3+jobs: This specifies the search query for "web3 jobs".
 *                The + sign between "web3" and "jobs" indicates that we want to search for results that contain both terms.
 *
 *                ibp=htl;jobs: This parameter tells Google to include job listings in the search results.
 *                ibp stands for "Instant Booking Partner", which is a legacy parameter that Google uses for various search features.
 */
const searchUrl = "https://www.google.com/search?q=web3+jobs&ibp=htl;jobs";

// Define a function for scraping the web
async function scrapeJobs() {
  // fetch url and store the response in a html variable
  const response = await fetch(searchUrl);
  const html = await response.text();

  // Use cheerio to parse the information from html
  const $ = load(html);

  // Create an empty array variable; jobs
  const jobs: IJob[] = [];

  // This css selector targets all li elements with the class name iFjolb.
  $("li.iFjolb").each((_, element) => {
    // These targets the specific css classes used by Google
    const title = $(element).find(".BjJfJf.PUpOsf").text();
    const description = $(element).find(".HBvzbc").text();
    const company = $(element).find(".vNEEBe").text();
    const image = $(element).find(".vNEEBe").attr("src");

    jobs.push({ title, description, company, image });
  });

  // Store the jobs in the Supabase database
  const { data, error } = await supabase.from("jobs").insert(jobs);

  if (error) {
    console.error(error);
  } else {
    console.log(`Inserted ${jobs.length} jobs`);
    console.log("=======================================");
    console.log(data);
  }
}

scrapeJobs();

// Run the scraper every 24 hours
cron.schedule("0 0 * * *", () => {
  scrapeJobs();
});
