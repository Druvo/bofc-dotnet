# Backend Implementation: Auto-Complete Matches After 120 Minutes

## Overview
This guide provides the implementation details for automatically completing matches that have been running for 120 minutes (or their configured duration) in the backend.

## Implementation Steps

### 1. Create a Scheduled Task Service

Create a new service class to handle automatic match completion:

**File:** `src/main/java/com/bjit/bofc/bofcfootball/service/MatchAutoCompleteService.java`

```java
package com.bjit.bofc.bofcfootball.service;

import com.bjit.bofc.bofcfootball.entity.Fixture;
import com.bjit.bofc.bofcfootball.repository.FixtureRepository;
import com.bjit.bofc.bofcfootball.enums.MatchStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class MatchAutoCompleteService {

    private static final Logger logger = LoggerFactory.getLogger(MatchAutoCompleteService.class);
    private static final int MAX_MATCH_DURATION_MINUTES = 120;

    @Autowired
    private FixtureRepository fixtureRepository;

    @Autowired
    private TournamentRoundServiceImpl tournamentRoundService; // Or your match service

    /**
     * Runs every minute to check for matches that need to be auto-completed
     */
    @Scheduled(fixedRate = 60000) // Run every 60 seconds (1 minute)
    @Transactional
    public void autoCompleteExpiredMatches() {
        try {
            // Find all ongoing matches
            List<Fixture> ongoingMatches = fixtureRepository.findByMatchStatus(MatchStatus.ONGOING);

            LocalDateTime now = LocalDateTime.now();
            int autoCompletedCount = 0;

            for (Fixture match : ongoingMatches) {
                if (shouldAutoComplete(match, now)) {
                    try {
                        completeMatch(match);
                        autoCompletedCount++;
                        logger.info("Auto-completed match ID: {} after {} minutes", 
                            match.getId(), getElapsedMinutes(match, now));
                    } catch (Exception e) {
                        logger.error("Failed to auto-complete match ID: {}", match.getId(), e);
                    }
                }
            }

            if (autoCompletedCount > 0) {
                logger.info("Auto-completed {} match(es) that exceeded duration limit", autoCompletedCount);
            }
        } catch (Exception e) {
            logger.error("Error in auto-complete scheduled task", e);
        }
    }

    /**
     * Check if a match should be auto-completed
     */
    private boolean shouldAutoComplete(Fixture match, LocalDateTime now) {
        if (match.getStartedAt() == null) {
            return false; // Match hasn't started yet
        }

        // Calculate elapsed time in minutes
        long elapsedMinutes = getElapsedMinutes(match, now);

        // Get the match duration limit (use configured duration or default to 120)
        int matchDurationLimit = match.getMatchDurationMinutes() != null 
            ? Math.min(match.getMatchDurationMinutes(), MAX_MATCH_DURATION_MINUTES)
            : MAX_MATCH_DURATION_MINUTES;

        // Auto-complete if elapsed time exceeds the limit
        return elapsedMinutes >= matchDurationLimit;
    }

    /**
     * Calculate elapsed minutes since match started
     */
    private long getElapsedMinutes(Fixture match, LocalDateTime now) {
        if (match.getStartedAt() == null) {
            return 0;
        }
        
        LocalDateTime startedAt = match.getStartedAt();
        if (startedAt.isAfter(now)) {
            return 0; // Started in the future (shouldn't happen, but safety check)
        }
        
        return ChronoUnit.MINUTES.between(startedAt, now);
    }

    /**
     * Complete the match automatically
     */
    private void completeMatch(Fixture match) {
        // Calculate final duration (capped at 120 minutes)
        int finalDuration = (int) Math.min(
            getElapsedMinutes(match, LocalDateTime.now()),
            MAX_MATCH_DURATION_MINUTES
        );

        // Update match status to COMPLETED
        match.setMatchStatus(MatchStatus.COMPLETED);
        match.setCompletedAt(LocalDateTime.now());
        match.setMatchDurationMinutes(finalDuration);
        
        // Update elapsed time to final duration
        if (match.getElapsedTimeSeconds() == null || 
            match.getElapsedTimeSeconds() > (finalDuration * 60)) {
            match.setElapsedTimeSeconds(finalDuration * 60);
        }

        // Save the match
        fixtureRepository.save(match);

        // Optionally: Record MATCH_COMPLETED event if event recording is available
        // recordMatchCompletedEvent(match);
    }
}
```

### 2. Enable Scheduling in Spring Boot

**File:** `src/main/java/com/bjit/bofc/bofcfootball/BofcFootballApplication.java`

Add `@EnableScheduling` annotation:

```java
@SpringBootApplication
@EnableScheduling  // Add this annotation
public class BofcFootballApplication {
    public static void main(String[] args) {
        SpringApplication.run(BofcFootballApplication.class, args);
    }
}
```

### 3. Update Fixture Repository (if needed)

Ensure your `FixtureRepository` has a method to find ongoing matches:

**File:** `src/main/java/com/bjit/bofc/bofcfootball/repository/FixtureRepository.java`

```java
import com.bjit.bofc.bofcfootball.enums.MatchStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface FixtureRepository extends JpaRepository<Fixture, Long> {
    List<Fixture> findByMatchStatus(MatchStatus status);
}
```

### 4. Optional: Record MATCH_COMPLETED Event

If you want to record a `MATCH_COMPLETED` event when auto-completing:

```java
private void recordMatchCompletedEvent(Fixture match) {
    try {
        // Assuming you have a MatchEventService
        MatchEvent event = new MatchEvent();
        event.setMatchId(match.getId());
        event.setEventType(MatchEventType.MATCH_COMPLETED);
        event.setPlayerId(0); // System event
        event.setTeamId(match.getHomeTeamId());
        event.setEventTime(match.getMatchDurationMinutes());
        event.setDescription(String.format(
            "Match auto-completed after %d minutes. Final score: %s %d - %d %s",
            match.getMatchDurationMinutes(),
            match.getHomeTeamName(),
            match.getHomeTeamScore(),
            match.getAwayTeamScore(),
            match.getAwayTeamName()
        ));
        event.setCreatedDate(LocalDateTime.now());
        
        matchEventRepository.save(event);
    } catch (Exception e) {
        logger.warn("Failed to record MATCH_COMPLETED event for match ID: {}", match.getId(), e);
    }
}
```

## Notes

- The scheduled task runs every minute to check for expired matches
- Matches are auto-completed when elapsed time >= configured duration (capped at 120 minutes)
- The final duration is calculated and saved when auto-completing
- All matches are capped at 120 minutes maximum duration
- The task is transactional to ensure data consistency

## Integration with Frontend

The frontend is already updated to:
- Allow optional duration when completing matches manually
- Calculate duration automatically if not provided
- Display messages about auto-completion after 120 minutes

No frontend changes are needed - the backend will handle auto-completion automatically.
