import chalk from 'chalk';
import { Octokit } from 'octokit';
import open from 'open';

import { type Input } from '.';
import { type GithubRepository, fetchIssueTemplates, createGithubIssueUrl } from './utils/github';
import { prompt } from './utils/prompts';

export async function createIssue(arg: Input) {
  const repo = await resolveOptions(arg);
  const template = await fetchIssueTemplates(new Octokit(), repo);

  if (!template.templates.length && !template.links.length) {
    return await open(createGithubIssueUrl(repo));
  }

  const { url } = await prompt({
    type: 'select',
    name: 'url',
    message: 'Pick an issue template',
    choices: createTemplateChoices(repo, template),
  });

  await open(url);
}

async function resolveOptions(arg: Input): Promise<GithubRepository> {
  let [ownerOrRepo, name] = arg._;

  if (!ownerOrRepo) {
    ({ ownerOrRepo } = await prompt({
      type: 'text',
      name: 'ownerOrRepo',
      message: `What is the ${chalk.bold('owner')} of the repository for this issue?`,
      validate: (value) =>
        typeof value === 'string' && value.length > 0
          ? true
          : 'Provide the owner or full repository name. E.g. "facebook", or "facebook/react"',
    }));
  }

  if (ownerOrRepo?.includes('/')) {
    const [owner, repo] = ownerOrRepo.split('/');
    return { owner, name: repo ?? name };
  }

  if (!name) {
    ({ name } = await prompt({
      type: 'text',
      name: 'name',
      message: `What is the ${chalk.bold('name')} of the repository for this issue?`,
    }));
  }

  return { owner: ownerOrRepo, name };
}

function createTemplateChoices(
  repo: GithubRepository,
  { templates, links, emptyIssuesEnabled }: Awaited<ReturnType<typeof fetchIssueTemplates>>,
) {
  return [
    ...templates.map((template) => ({
      title: template.content.name,
      description: template.content.description,
      value: String(createGithubIssueUrl(repo, { ...template.content, id: template.name })),
    })),
    ...links.map((link) => ({
      title: link.name,
      description: link.about,
      value: link.url,
    })),
    {
      title: 'Start from an empty issue',
      description: `Don't see your issue here?`,
      value: createGithubIssueUrl(repo),
      disabled: !emptyIssuesEnabled,
    },
  ];
}
