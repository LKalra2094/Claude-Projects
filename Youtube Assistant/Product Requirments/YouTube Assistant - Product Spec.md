# Product Spec: YouTube Assistant

**Product Manager:** Lakshya Kalra  
**Date:** January 2026  
--**Stage:** Product Spec 
**Status:** In Progress

---

## Executive Summary

YouTube Assistant helps power learners find high-quality educational videos without wasting time on clickbait and filler content. The tool analyzes YouTube API data to rank videos by information density and relevance, then surfaces the best matches for any learning query. This spec defines the scope, user experience, and technical approach for the initial build.

---

## User Stories

| As a... | I want... | So that... |
|---------|--------------|------------|
| User | To describe a topic I want to learn about in natural language | I can find relevant videos without crafting search keywords |
| Time-conscious user | To see videos ranked by information density and relevence | I avoid padded content and respect my time |
| user with varying knowledge across topics | To get content appropriate for my current understanding | I find videos that develop my existing knowledge further |
| Long term user | To provide feedback on each ranking | the recommendations are personalized for me in the future |
| Power user | better recommendations as I use the product more | I derive even more value from the product |

## Functional Requirements

**Must-Have (P0)**

- Natural language query input that accepts topic descriptions
- YouTube API integration to fetch video metadata for candidate videos
- Ranking algorithm that scores videos based on available signals
- Results display showing top N videos 
- Simple, user friendly UI

**Should-Have (P1)**

- Simple thumbs up/down feedback mechanism for each result to enable data gathering to improve recommendation model 
- Logging of user feedback against video metadata to build ML recommedation model in the future 
- Video duration preferences to set minimum or maximum length
- Query history to revisit past searches without re-entering them
- Channel reputation scoring based on historical video quality
- Voice to Text trascription to convert the videos watched into md files and saved into my Obsidian 

---

## Experience

### User Flow

The core experience follows a five-step flow designed for speed and transparency.

| Step | User Action | System Response |
|------|-------------|-----------------|
| 1. Query | User enters a natural language description of what they want to learn | System parses intent and extracts key concepts |
| 2. Search | User waits | System queries YouTube API and retrieves N candidate videos |
| 3. Rank | User waits | System scores videos using ranking algorithm and sorts results |
| 4. Review | User reviews ranked results | System displays top videos with score breakdown |
| 5. Watch | User selects a video to watch and clicks on it | System redirects to Youtube link for that video in a new tab |
| 6. Feedback | User provides thumbs up/down on results they evaluate | System logs feedback for future ranking improvements |

### Interface Wireframe

The interface prioritizes simplicity over feature density. A single-page layout contains three zones.

**Query Zone (Top):** A large text input field dominates the top of the page. Placeholder text guides users with an example query. A "Find Videos" button triggers the search.

**Results Zone (Center):** Each result displays as a card containing the video thumbnail, title, channel name, duration, likes, views, comments, comment score and overall quality score. A grid of 5x2 (5 rows and 2 columns) shows 10 results. User can scroll down to see the lower rank videos. Thumbs up/down icons appear on the bottom right side of the results.

**Status Zone (Bottom):** A persistent footer shows youtube API units used un till then and as a % of the total free limit available daily. 


### Ranking Algorithm Design

The ranking system combines multiple signals available through the YouTube Data API v3. Each signal addresses a different dimension of video quality.

| Signal                    | Source                                         | Quality Indicator                        | Weight |
| ------------------------- | ---------------------------------------------- | ---------------------------------------- | ------ |
| Like-to-View Ratio        | statistics.likeCount / statistics.viewCount    | Audience approval after watching         | High   |
| Comment Density           | statistics.commentCount / statistics.viewCount | Engagement depth beyond passive viewing  | Medium |
| Comment sentiment         |                                                | Sentiment of customer comment            | High   |
| Channel Subscriber Count  | channel.subscriberCount                        | Channel credibility and audience loyalty | Medium |
| Query-Description Overlap | search input vs snippet.description            | Relevance                                | Medium |


The algorithm normalizes each signal to a 0-1 scale, applies weights, and produces a composite score. Initial weights derive from personal intuition and will adjust based on user feedback over time.

---

## Risks and Open Questions

- Youtube API allows agents to pull the required data
- Single-user tool requires no authentication
- How many candidates should the system analyze per query
- How to ensure that the initial list of candidates itself is of good qualtiy 
- What is the YouTube API quota and cost structure?
- How should the system handle topics with few quality videos?
- How will the system log and store user feedabck against youtube metadata 
- Will this require Claude API or can it work via Claude code?

---

## Next Steps

1. Discovery of YouTube API and documentation of available data fields
2. Discovery of Claude API vs Claude code
3. Design wireframes 
4. Discovery of authentication requirements for single user tool  
5. Discovery of methadology for creating cnadidate list of videos and address edge cases
6. Discovery of backend system to store user feedback 

