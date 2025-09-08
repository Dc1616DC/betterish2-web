/**
 * @jest-environment node
 */

import { POST } from '@/app/api/ai/breakdown/route';
import { NextRequest } from 'next/server';

// Mock OpenAI
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
  }));
});

describe('/api/ai/breakdown', () => {
  let mockCreate;

  beforeAll(() => {
    // Get access to the mocked create function
    const OpenAI = require('openai');
    const mockInstance = new OpenAI();
    mockCreate = mockInstance.chat.completions.create;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.OPENAI_API_KEY = 'test-api-key';
  });

  test('returns subtasks for valid task', async () => {
    const mockResponse = {
      choices: [{
        message: {
          content: '["Research contractors", "Get quotes", "Schedule work", "Complete project"]'
        }
      }]
    };

    mockCreate.mockResolvedValueOnce(mockResponse);

    const request = new NextRequest('http://localhost:3000/api/ai/breakdown', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        taskTitle: 'Install new shower',
        context: 'Master bathroom renovation'
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.subtasks).toEqual([
      "Research contractors",
      "Get quotes", 
      "Schedule work",
      "Complete project"
    ]);
    expect(data.originalTask).toBe('Install new shower');

    expect(mockCreate).toHaveBeenCalledWith({
      model: "gpt-3.5-turbo",
      messages: [{
        role: "user",
        content: expect.stringContaining('Install new shower')
      }],
      max_tokens: 300,
      temperature: 0.7,
    });
  });

  test('returns 400 for missing task title', async () => {
    const request = new NextRequest('http://localhost:3000/api/ai/breakdown', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Task title is required');
    expect(mockCreate).not.toHaveBeenCalled();
  });

  test('handles OpenAI API errors gracefully', async () => {
    mockCreate.mockRejectedValueOnce(new Error('API Error'));

    const request = new NextRequest('http://localhost:3000/api/ai/breakdown', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        taskTitle: 'Test task'
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.fallback).toBe(true);
    expect(data.subtasks).toEqual([
      "Research and plan approach",
      "Gather necessary materials",
      "Complete the main work",
      "Review and finalize"
    ]);
  });

  test('handles invalid JSON response from OpenAI', async () => {
    const mockResponse = {
      choices: [{
        message: {
          content: 'Invalid JSON response'
        }
      }]
    };

    mockCreate.mockResolvedValueOnce(mockResponse);

    const request = new NextRequest('http://localhost:3000/api/ai/breakdown', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        taskTitle: 'Test task'
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.subtasks).toEqual(['Invalid JSON response']);
    expect(data.originalTask).toBe('Test task');
  });

  test('uses fallback subtasks for home organization', async () => {
    mockCreate.mockRejectedValueOnce(new Error('API Error'));

    const request = new NextRequest('http://localhost:3000/api/ai/breakdown', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        taskTitle: 'Organize garage'
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.fallback).toBe(true);
    expect(data.subtasks).toEqual([
      "Sort items into keep/donate/trash",
      "Clean and prepare the space",
      "Set up organization system", 
      "Put everything in its place"
    ]);
  });
});