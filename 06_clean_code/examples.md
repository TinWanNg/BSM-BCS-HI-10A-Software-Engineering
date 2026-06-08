## 1. Meaningful Variable Names

### Before

```ts
const x = model.predict(data);
```

### After

```ts
const homeTeamWinProbability = predictionModel.predict(matchFeatures);
```

=> communicates what the value represents so that other developers can understand the code the expectations easily.

---

## 2. Define Numbers

### Before

```ts
if (confidence > 0.75) {
    publishPrediction();
}
```

### After

```ts
const MIN_CONFIDENCE_THRESHOLD = 0.75;

if (confidence > MIN_CONFIDENCE_THRESHOLD) {
    publishPrediction();
}
```

=> so the threshold (or other meaningful numbers) can be changed in a single location and reused throughout the code.

---

## 3. Single Responsibility Principle

### Before

```ts
async function generatePrediction(matchId: string) {
    const data = await fetchMatchData(matchId);
    const model = await loadModel();
    const prediction = model.predict(data);

    await sendNotifications(prediction);
}
```

### After

```ts
async function generatePrediction(matchId: string) {
    const matchData = await matchService.getMatchData(matchId);
    const prediction = await predictionService.calculatePrediction(matchData);
    const notifications = await notificationService.sendNotifications(prediction);
}
```

=> specialized services handle individual responsibilities, then a function focuses on orchestrating them.

---

## 4. Eliminate Duplicate Code

### Before

```ts
function calculateHomeWinRate(team: Team): number {
    return team.wins / team.matchesPlayed;
}

function calculateAwayWinRate(team: Team): number {
    return team.wins / team.matchesPlayed;
}
```

### After

```ts
function calculateWinRate(team: Team): number {
    return team.wins / team.matchesPlayed;
}
```

=> centralise logic to avoid inconsistencies during maintenance.

---

## 5. Explicit Error Handling

### Before

```ts
try {
    await predictionService.generatePrediction();
} catch (error) {
}
```

### After

```ts
try {
    await predictionService.generatePrediction();
} catch (error) {
    logger.error(
        "Prediction generation failed",
        error
    );

    throw new PredictionError(
        "Unable to generate prediction"
    );
}
```

=> log errors properly for debugging and handle possible errors gracefully.