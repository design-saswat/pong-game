const { test, expect } = require('@playwright/test');

test('paddle stays inside the board and ball keeps moving', async ({ page }) => {
  await page.goto('http://127.0.0.1:8000/');

  const gameBoard = page.locator('#gameBoard');
  const playerPaddle = page.locator('#playerPaddle');

  await page.mouse.move(400, 260);
  await page.waitForTimeout(100);

  const topBefore = await playerPaddle.evaluate((el) => parseFloat(el.style.top || '0'));
  expect(topBefore).toBeGreaterThanOrEqual(0);

  await page.locator('#startBtn').click();
  await page.waitForTimeout(500);

  const ballBefore = await page.locator('#ball').evaluate((el) => ({
    left: parseFloat(el.style.left || '0'),
    top: parseFloat(el.style.top || '0')
  }));

  await page.waitForTimeout(500);

  const ballAfter = await page.locator('#ball').evaluate((el) => ({
    left: parseFloat(el.style.left || '0'),
    top: parseFloat(el.style.top || '0')
  }));

  expect(ballAfter.left).not.toBe(ballBefore.left);
  expect(ballAfter.top).not.toBe(ballBefore.top);

  const topAfter = await playerPaddle.evaluate((el) => parseFloat(el.style.top || '0'));
  expect(topAfter).toBeGreaterThanOrEqual(0);
  expect(topAfter).toBeLessThanOrEqual(await gameBoard.evaluate((el) => el.clientHeight - 100));
});
