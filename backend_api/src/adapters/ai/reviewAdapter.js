'use strict';

/**
 * AI review adapter.
 *
 * This module provides a strategy-based adapter to allow swapping providers without patchy if/else logic
 * spread across the codebase.
 */

// PUBLIC_INTERFACE
function createAiReviewer(config) {
  /**
   * Factory for the AI reviewer implementation.
   *
   * Contract:
   * - Inputs: config.ai.provider ('stub' by default)
   * - Output: { reviewCode({ language, code, title? }): Promise<{ summary, issues, suggestions, raw_result, model }> }
   * - Errors: throws on unsupported provider.
   */
  const provider = (config.ai.provider || 'stub').toLowerCase();

  const implementations = {
    stub: createStubReviewer(),
    // openai: createOpenAiReviewer(config) // future
  };

  const impl = implementations[provider];
  if (!impl) {
    throw new Error(`Unsupported AI_PROVIDER: ${config.ai.provider}`);
  }
  return impl;
}

function createStubReviewer() {
  return {
    async reviewCode({ language, code }) {
      // Deterministic stub: safe, no network access, useful for local dev and CI.
      const lineCount = (code || '').split('\n').length;
      const summary = `Stub review: received ${lineCount} lines of ${language} code.`;

      const issues = [
        {
          severity: 'info',
          title: 'Stub reviewer active',
          description: 'AI_PROVIDER=stub is enabled. Configure a real provider to get AI-generated feedback.',
          location: null,
        },
      ];

      const suggestions = [
        {
          title: 'Add a README to your project',
          description: 'Include usage, setup, and contribution guidelines.',
        },
      ];

      return {
        summary,
        issues,
        suggestions,
        raw_result: {
          provider: 'stub',
          language,
          lineCount,
        },
        model: 'stub-1',
      };
    },
  };
}

module.exports = {
  createAiReviewer,
};
