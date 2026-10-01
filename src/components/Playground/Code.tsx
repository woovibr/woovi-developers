import React from 'react';
import CodeBlock from '@theme/CodeBlock';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

import styles from './Playground.module.css';

export function Code({
  code,
  language = 'json',
}: {
  code: string;
  language?: string;
}) {
  return (
    <div className={styles.code}>
      <CodeBlock language={language}>{code}</CodeBlock>
    </div>
  );
}

/** language tabs synced across the page (and the site) through groupId */
export function CodeTabs({
  tabs,
  groupId = 'playground-lang',
}: {
  tabs: { label: string; language: string; code: string }[];
  groupId?: string;
}) {
  return (
    <div className={styles.code}>
      <Tabs groupId={groupId} lazy>
        {tabs.map((t) => (
          <TabItem key={t.label} value={t.label} label={t.label}>
            <CodeBlock language={t.language}>{t.code}</CodeBlock>
          </TabItem>
        ))}
      </Tabs>
    </div>
  );
}
