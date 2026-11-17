import { Contact } from "@/components/site/contact";
import { Hero } from "@/components/site/hero";
import { Legacy } from "@/components/site/legacy";
import { Partners } from "@/components/site/partners";
import { Process } from "@/components/site/process";
import { Reach } from "@/components/site/reach";
import { SectionPager } from "@/components/site/section-pager";
import { Services } from "@/components/site/services";
import { Standards } from "@/components/site/standards";

export default function HomePage() {
  return (
    <div data-snap-page>
      <SectionPager />
      <Hero />
      <Legacy />
      <Services />
      <Process />
      <Partners />
      <Standards />
      <Reach />
      <Contact />
    </div>
  );
}
