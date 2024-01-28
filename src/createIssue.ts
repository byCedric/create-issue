import chalk from 'chalk';
import { Octokit } from 'octokit';
import open from 'open';
import ora from 'ora';

import { type Input } from '.';
import { type GithubRepository, fetchIssueTemplates, createGithubIssueUrl } from './utils/github';
import { prompt } from './utils/prompts';

export async function createIssue(arg: Input) {
  const repo = await resolveOptions(arg);
  const spinner = ora(`Fetching repo ${chalk.bold(repo.owner)}/${chalk.bold(repo.name)}`).start();

  const template = await fetchIssueTemplates(new Octokit(), repo);

  if (!template.templates.length && !template.links.length) {
    spinner.succeed('Opening a new issue');
    return await open(createGithubIssueUrl(repo));
  }

  const choices = createTemplateChoices(repo, template);

  if (arg['--template']) {
    const choice = choices.find(
      (choice) => arg['--template'] === choice.id || choice.id.startsWith(arg['--template']),
    );

    if (choice) {
      spinner.succeed(`Picking issue template: ${choice.title}`);
      return await open(choice.value.url);
    } else {
      spinner.fail(`Could not find issue template: ${chalk.bold(arg['--template'])}`);
    }
  } else {
    spinner.stop();
  }

  const { choice } = await prompt({
    type: 'select',
    name: 'choice',
    message: 'Pick issue template',
    choices,
  });

  await open(choice.url);
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
      id: template.name,
      title: template.content.name,
      description: template.content.description,
      value: {
        url: String(createGithubIssueUrl(repo, { ...template.content, id: template.name })),
        title: template.content.name,
      },
    })),
    ...links.map((link) => ({
      id: link.url,
      title: link.name,
      description: link.about,
      value: {
        url: link.url,
        title: link.name,
      },
    })),
    {
      id: '_blank',
      title: 'Start from an empty issue',
      description: `Don't see your issue here?`,
      value: {
        url: createGithubIssueUrl(repo),
        title: '_blank',
      },
      disabled: !emptyIssuesEnabled,
    },
  ];
}
