import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter, Redirect } from 'wouter';
import { Layout } from '@/components/layout';

import Dashboard from '@/pages/dashboard';
import Finance from '@/pages/finance';
import Subscriptions from '@/pages/subscriptions';
import Assets from '@/pages/assets';
import Documents from '@/pages/documents';
import AI from '@/pages/ai';

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={() => <Redirect to="/dashboard" />} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/finance" component={Finance} />
        <Route path="/subscriptions" component={Subscriptions} />
        <Route path="/assets" component={Assets} />
        <Route path="/documents" component={Documents} />
        <Route path="/ai" component={AI} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <Router />
      </WouterRouter>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
