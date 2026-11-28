---
title: The role of process monitoring devices and digital line balancing in achieving
  operational excellence in garment manufacturing - MedCrave online
id: the-role-of-process-monitoring-devices-and-digital-line-balancing-in-achieving-o
tags:
- estilista-producao-moda-8b096b
created: '2026-11-27T02:19:06.943137Z'
source: https://doi.org/10.15406/jteft.2024.10.00386
source_domain: doi.org
fetched_at: '2026-11-27T02:18:58.699675Z'
fetch_provider: crawl4ai
status: draft
type: note
tier: institutional
content_type: paper
deprecated: false
doi: 10.15406/jteft.2024.10.00386
utility_score: 15.0
---

  * [Article Processing Charges](https://medcraveonline.com/apc)


  1. [The role of process monitoring devices and digital line balancing in achieving operational excellence in garment manufacturing](https://medcraveonline.com/JTEFT/the-role-of-process-monitoring-devices-and-digital-line-balancing-in-achieving-operational-excellence-in-garment-manufacturing.html)


######  _**[Submit manuscript...](https://medcraveonline.com/submitmanuscript)**_
##### Journal of
###### eISSN: 2574-8114 
#  Textile Engineering & Fashion Technology
Research Article Volume 10 Issue 5
# The role of process monitoring devices and digital line balancing in achieving operational excellence in garment manufacturing
####  Bülent Koç, Selin Hanife Eryürük 
Textile Engineering Department, Faculty of Textile Technologies and Design, Istanbul Technical University, Turkey
**Correspondence:** Bülent Koç, Textile Engineering Department, Faculty of Textile Technologies and Design, Istanbul Technical University, Turkey
Received: October 12, 2024 | Published: October 23, 2024
**Citation:** Koç B, Eryürük SH. The role of process monitoring devices and digital line balancing in achieving operational excellence in garment manufacturing. _J Textile Eng Fashion Technol_. 2024;10(5):180-186. DOI: [10.15406/jteft.2024.10.00386](https://doi.org/10.15406/jteft.2024.10.00386)
[ Download PDF](https://medcraveonline.com/JTEFT/JTEFT-10-00386.pdf)
# Abstract
This study investigates the transformative potential of integrating digital technologies with lean manufacturing principles to address the evolving challenges in the garment industry. The industry demands high-quality products, rapid delivery, cost efficiency, and production flexibility to maintain competitiveness and sustainability. While traditional lean methods have focused on waste reduction and process optimization, the advent of digitalization offers unprecedented opportunities for enhancing operational excellence.
This research specifically examines the role of Internet of Things-based Process Monitoring Devices (PMDs) and digital line balancing in achieving these goals. PMDs, integrated within a digital lean framework, facilitate continuous monitoring of machine performance and operator efficiency, providing real-time insights into operational processes. This real-time visibility enables data-driven decision-making and centralized analysis, fostering agility and responsiveness. Furthermore, this study presents a dynamic digital line balancing algorithm that optimizes sewing line configurations and workload distribution. This dynamic approach allows for real-time adaptations in production flows to mitigate bottlenecks and boost productivity. By exploring the synergistic relationship between PMDs, digital line balancing, and lean principles, this paper contributes to a comprehensive understanding of how digital solutions can revolutionize operational efficiency in the garment manufacturing sector.
**Keywords:** garment industry, lean manufacturing, digitalization, process monitoring devices (PMDS), digital line-balancing, process optimization
# Introduction
Low productivity and production delays represent persistent challenges within the apparel industry, particularly for small and medium-sized enterprises. These challenges are often exacerbated by fragmented production processes, where operations such as cutting, sewing, and packaging are segregated into distinct departments. This compartmentalized approach necessitates continuous material transportation and poses significant challenges for workflow coordination. Furthermore, quality control, typically relegated to a separate department, often results in the late identification of defects, necessitating costly rework or product sorting. Lean manufacturing offers a compelling solution to these challenges by advocating for a small-batch production paradigm that prioritizes flexibility and speed. This approach, adaptable across diverse organizational structures and processes, centers on maximizing customer value while minimizing waste throughout the production cycle. Apparel companies must embrace lean manufacturing approaches and analysis tools to achieve more flexible and agile production and distribution processes, which are essential for meeting the challenge of short product life cycles due to fashion trends.
The concept of Industry 4.0, introduced as a result of a German government initiative over a decade ago, represents a fundamental shift in the way production processes are integrated and optimized. This digital revolution involves the seamless incorporation of the Internet of Things and information and communication technology into manufacturing, enabling real-time data tracking, analysis, and optimization of production activities.
By digitizing lean processes, companies can monitor and measure production in real time through data tracking, big data analytics, and advanced analysis techniques. IoT-based production tracking modules facilitate instant data collection across operations, transmitting information to cloud-based networks. This enables real-time monitoring of operational efficiency, operator performance, downtime, and defect rates. The feedback provided through these systems empowers operators to monitor their performance, adjust their pace, and communicate with supervisors as needed. Such digital solutions create a collaborative environment where operators and teams are actively engaged in meeting departmental and organizational goals.
Furthermore, the integration of advanced optimization algorithms within these systems facilitates precise refinement of machine layouts and dynamic balancing of workloads. These algorithms operate in synergy with digital lean principles, leveraging real-time production data to adapt to shifting demands and operational conditions.In this study, the software-based line balancing algorithm plays a crucial role by continuously analyzing production data, pinpointing bottlenecks, and reallocating tasks among workstations. This adaptive approach ensures that operations adhere to the principles of continuous flow, minimizing idle time and mitigating inefficiencies throughout the assembly line. Consequently, the system not only boosts productivity but also cultivates a resilient and responsive manufacturing environment, adept at swiftly adjusting to fluctuations in production requirements.
#  Theoretical framework
ABC Apparel has initiated a comprehensive lean transformation, leveraging digital tools to enhance production efficiency across its operations. The company employs an Internet of Things (IoT)-based shop floor control system to monitor operations across its sewing lines in real-time. This system utilizes a Process Monitoring Device (PMD), as shown in [Figure 1](https://medcraveonline.com/JTEFT/the-role-of-process-monitoring-devices-and-digital-line-balancing-in-achieving-operational-excellence-in-garment-manufacturing.html#fig1), to continuously collect data on machine performance, operator efficiency, and production output, thereby providing immediate visibility into production status. 
**Figure 1** PMD shop floor device.
The PMD gathers and transmits real-time data on key performance indicators (KPIs) for each production unit to the management software. This integrated setup not only analyzes and optimizes performance metrics but also delivers instant feedback to operators, facilitating swift adjustments to workflows and minimizing downtime. As
essential tools for shop floor control, PMDs enable real-time tracking of production processes, resulting in several significant benefits, as illustrated in [Figure 2](https://medcraveonline.com/JTEFT/the-role-of-process-monitoring-devices-and-digital-line-balancing-in-achieving-operational-excellence-in-garment-manufacturing.html#fig2).
**Figure 2** Overview of PMD benefits for shop floor control management. 
**Process Monitoring Devices (PMDs)**
The digitalization of the sewing process has been a significant advancement in the apparel industry, and the Process Monitoring Device plays a crucial role in this transformation. This technology enables real-time data collection from sewing machines and operations through the Internet of Things, which in turn facilitates cloud storage and comprehensive data analysis. The RFID-based sensors and Card Management System used in the PMD device allow for online monitoring and recording of machine activities, which can be accessed and analyzed as big data.
When the operator's RFID card is recognized, the device starts tracking the actual working time from the beginning of the operation until the operator pauses or finishes the task. If the operator removes their RFID card or powers down the machine, the device logs a "operator left the machine" status and sends this information to the server. To further enhance accountability and minimize non-productive time, PMDs prompt operators to select a reason for their departure from a predefined list when they re-engage with any PMD-equipped machine. This mandatory justification, combined with the time data transmitted to the server, enables precise recording of lost time between work intervalsas shown in [Figure 3](https://medcraveonline.com/JTEFT/the-role-of-process-monitoring-devices-and-digital-line-balancing-in-achieving-operational-excellence-in-garment-manufacturing.html#fig3). By analyzing these patterns, manufacturers can identify and address recurring causes of downtime, ultimately boosting productivity.
**Figure 3** PMD downtime management scenario.
Equipped with performance indicators at the top and quality indicators at the bottom, the Process Monitoring Device delivers immediate visual feedback on operational efficiency and repair rates, significantly enhancing production monitoring. This visual control mechanism is crucial in lean manufacturing, as it empowers operators to quickly assess performance and make real-time adjustments, streamlining the production process and driving continuous improvement efforts. By connecting to a central system via the internet, PMDs facilitate a continuous flow of data from individual sewing machines to a centralized repository, enabling the aggregation and analysis of vast amounts of data, commonly referred to as "big data." This interconnectedness allows for a more holistic and comprehensive understanding of the sewing process, enabling manufacturers to identify and address systemic inefficiencies and bottlenecks.
The insights derived from this data analysis empower apparel manufacturers to make informed, data-driven decisions that optimize their operations across various dimensions. By analyzing operator activity patterns, manufacturers can identify and address bottlenecks in the workflow, adjust work assignments based on skill levels, and implement targeted training programs to enhance overall efficiency. Furthermore, analyzing material usage data allows manufacturers to identify areas of waste and optimize their material consumption, reducing costs and promoting sustainability within the apparel production process.
**Digital Line Balancing Algorithms (DLBA)**
In the context of sewing line optimization, the term "station" refers to individual operators, operating under the assumption that there are no machine restrictions. Departing from conventional approaches, this algorithm prioritizes the optimization of workforce distribution across the assembly line. By minimizing capacity and workload imbalances at each workstation, this algorithm aims to achieve a more efficient and balanced sewing line operation. By considering the following data sets, the algorithm effectively redistributes tasks to enhance efficiency:
  1. **Production data:** This set includes real-time production quantities collected through Process Monitoring Devices (PMD), operators' working times, standard minute values (SMV), production cycle times, and performance data at workstations. These data serve as essential inputs for optimizing workload distribution.
  2. **Workstation data:** This data encompasses the capacity of workstations, cycle times for tasks performed at each station, available resources, and operational requirements. Workload distribution among stations is organized based on this information.
  3. **Operator data:** This set takes into account each operator's skill level, past performance data, working speed, and specific tasks they can perform. Operators are assigned to different workstations according to their skills and performance, optimizing overall productivity.
  4. The optimization process follows a structured approach:
  5. **Input parameters:** Users are required to enter either the "Daily Customer Demand" or the "Total Number of Operators" as the optimization interval. The software then calculates the optimal cycle time based on the specified production target. In this study, the daily customer demand is set at 1,500 pieces. Takt time, which serves as a key parameter for line balancing, is calculated using the following formula:


Takt time (tc)=Daily Working Time (C)Daily Customer Demand (Q)Takt time (tc)=Daily Working Time (C)Daily Customer Demand (Q) MathType@MTEF@5@5@+=feaagKart1ev2aqatCvAUfeBSjuyZL2yd9gzLbvyNv2CaerbuLwBLnhiov2DGi1BTfMBaeXatLxBI9gBaerbd9wDYLwzYbItLDharqqtubsr4rNCHbGeaGqiVu0Je9sqqrpepC0xbbL8F4rqqrFfpeea0xe9Lq=Jc9vqaqpepm0xbba9pwe9Q8fs0=yqaqpepae9pg0FirpepeKkFr0xfr=xfr=xb9adbaqaaeGaciGaaiaabeqaamaabaabaaGcbaqcLbsaqaaaaaaaaaWdbiaadsfacaWGHbGaam4AaiaadshacaGGGcGaamiDaiaadMgacaWGTbGaamyzaiaacckajuaGdaqadaGcpaqaaKqzGeWdbiaadshacaWGJbaakiaawIcacaGLPaaajugibiabg2da9Kqbaoaalaaak8aabaqcLbsapeGaamiraiaadggacaWGPbGaamiBaiaadMhacaGGGcGaam4vaiaad+gacaWGYbGaam4AaiaadMgacaWGUbGaam4zaiaacckacaWGubGaamyAaiaad2gacaWGLbGaaiiOaKqbaoaabmaak8aabaqcLbsapeGaam4qaaGccaGLOaGaayzkaaaapaqaaKqzGeWdbiaadseacaWGHbGaamyAaiaadYgacaWG5bGaaiiOaiaadoeacaWG1bGaam4CaiaadshacaWGVbGaamyBaiaadwgacaWGYbGaaiiOaiaadseacaWGLbGaamyBaiaadggacaWGUbGaamizaiaacckajuaGdaqadaGcpaqaaKqzGeWdbiaadgfaaOGaayjkaiaawMcaaaaaaaa@76F4@ (1)
For this study, the software calculates the takt time as 0.360 minutes per piece, as shown in [Figure 4](https://medcraveonline.com/JTEFT/the-role-of-process-monitoring-devices-and-digital-line-balancing-in-achieving-operational-excellence-in-garment-manufacturing.html#fig4). This takt time is then used as the cycle time for subsequent line balancing calculations.
**Figure 4** Digital line balancing ınterval screen.
  1. **Work sequence definition:** Operations must follow a predefined sequence, where each operation's initiation depends on the completion of the preceding one. Properly defining these dependent operations is essential to ensure accurate optimization calculations. [Figure 5](https://medcraveonline.com/JTEFT/the-role-of-process-monitoring-devices-and-digital-line-balancing-in-achieving-operational-excellence-in-garment-manufacturing.html#fig5) depicts the sewing process workflow chart for the D5210 Boxer, illustrating the sequence of stitching operations and their interdependencies for efficient workflow management.
  2. **Calculation execution:** The average performance for each task is derived from the factory's database, taking into account factors such as the specific operation, task description, or machine type. This data facilitates the dynamic adjustment of task durations based on actual performance. Once all parameters are set, users initiate the calculation process. The software then assigns tasks to each workstation, calculates the total working time, determines the hourly production rate, and evaluates overall line efficiency.


**Figure 5** Sewing process workflow chart for the D5210 boxer.
The Process Monitoring Device (PMD) continuously tracks performance metrics, enabling real-time adjustments to task durations. The algorithm achieves line balancing by factoring in both actual task times and the targeted takt time, this device enables real-time optimization of the workflow, ensuring that it consistently aligns with actual operating conditions.
#  Methodology 
The primary objective of this study is to develop a software-based methodology to optimize the sewing line organization for the production of the “D5210 Boxer Short” model. This analysis underscores the integration of lean principles with real-time, data-driven decision-making to enhance production line efficiency. [Table 1](https://medcraveonline.com/JTEFT/the-role-of-process-monitoring-devices-and-digital-line-balancing-in-achieving-operational-excellence-in-garment-manufacturing.html#tab1) presents a detailed overview of operation names, machine types, standard task times, and performance rates, providing valuable insights into the specific workflow and operational structure associated with this garment style. 
The digital algorithm computes the actual task durations for each operation based on the Standard Minute Values (SMV) and performance rates provided in [Table 1](https://medcraveonline.com/JTEFT/the-role-of-process-monitoring-devices-and-digital-line-balancing-in-achieving-operational-excellence-in-garment-manufacturing.html#tab1). It determines the number of operators required for each operation through a two-step process.  
|  **Task**  |  **Operation**  |  **Machine**  |  **Smv (min)**  |  **Performance rate**  |  **Actual Smv (min)**  |  
| --- | --- | --- | --- | --- | --- |  
|  Gusset Preperation  |  Overlock  |  0.46  |  42%  |  1.095  |  
|  Gusset Coverall  |  Lock Stitch  |  0.84  |  1.292  |  
|  Back Seam  |  Lock Stitch  |  0.257  |  89%  |  0.289  |  
|  Inside Seam  |  Lock Stitch  |  0.336  |  88%  |  0.382  |  
|  Hem Coverstitch  |  Flatlock  |  0.495  |  81%  |  0.614  |  
|  Elastic Ironing  |  Ironing Board  |  0.078  |  52%  |  0.150  |  
|  Elastic Cutting  |  Manual  |  0.246  |  61%  |  0.407  |  
|  Elastic Joining  |  Bartack  |  0.343  |  82%  |  0.418  |  
|  Elastic Attachment  |  Coverstitch  |  0.519  |  89%  |  0.584  |  
|  10  |  Elastic End Fastening  |  Bartack  |  0.249  |  77%  |  0.324  |  
|  11  |  Thread Trimming  |  Manual  |  0.455  |  93%  |  0.490  |  
|  12  |  Ironing  |  Ironing Board  |  0.369  |  56%  |  0.650  |  
|  13  |  Final Control  |  Manual  |  0.482  |  70%  |  0.689  |  
**Table 1** Overview of sewing work elements, machine types, standard minute values, and performance rates for the D5210 boxer short model
In the first step, the algorithm calculates the necessary number of operators using the ratio of actual task time (ti) to cycle time (tc). The integer part of this value dictates the number of operators assigned to each operation. Following this assignment, the algorithm computes the remaining task durations for each operation. [Figure 6](https://medcraveonline.com/JTEFT/the-role-of-process-monitoring-devices-and-digital-line-balancing-in-achieving-operational-excellence-in-garment-manufacturing.html#fig6) illustrates the results of our sample application, showcasing the fixed line calculation for line optimization.
**Figure 6** Results of line optimization fixed line calculation for operator assignment.
In the second step, the algorithm organizes the unassigned task durations according to the sequence of operations and calculates the position weights, considering both the unassigned durations and the dependencies among operations. Assignments commence with the station that possesses the highest position weight, ensuring that the total assigned task time does not exceed the target daily working duration of 540 minutes. This approach enables the assignment of multiple tasks to operators, thereby reducing the number of stations required while maximizing overall efficiency. [Figure 7](https://medcraveonline.com/JTEFT/the-role-of-process-monitoring-devices-and-digital-line-balancing-in-achieving-operational-excellence-in-garment-manufacturing.html#fig7) illustrates the optimization calculations based on the position weight algorithm.
**Figure 7** Station assignments based on position weights of unassigned task durations.
#  Results and discussions
The effective implementation of digital line-balancing algorithms demonstrates a competitive edge over traditional methods, not only in performance but also in enhancing resource optimization and workflow efficiency. These algorithms significantly improve overall operational efficiency and increase output per operator, aligning seamlessly with the daily customer demand. [Table 2](https://medcraveonline.com/JTEFT/the-role-of-process-monitoring-devices-and-digital-line-balancing-in-achieving-operational-excellence-in-garment-manufacturing.html#tab2) illustrates the outcomes of the digital line-balancing algorithm for the D5210 Boxer model. A detailed analysis of this table indicates that, to fulfill a daily customer demand of 1,500 units, 23 operators have been strategically assigned across 13 operations. Notably, some operators have been entrusted with multiple tasks, reflecting a dynamic approach to workforce allocation that maximizes productivity while minimizing resource use.  
|  **Task**  |  **Station Number**  |  **Operation**  |  **Machine**  |  **Operator**  |  **Station time (min)**  |  
| --- | --- | --- | --- | --- | --- |  
|  Gusset Preparation  |  Overlock  |  Serpil A.  |  540  |  
|  Gusset Preparation  |  Overlock  |  Sevcan Y.  |  540  |  
|  Gusset Preparation  |  Overlock  |  Hatice T.  |  540  |  
|  Gusset Preparation  |  Overlock  |  Sevda C.  |  22,5  |  
|  Gusset Coverall  |  Lock Stitch  |  Sevda C.  |  318  |  
|  Gusset Coverall  |  Lock Stitch  |  Emine C.  |  540  |  
|  Gusset Coverall  |  Lock Stitch  |  IVILizevyen G.  |  540  |  
|  Gusset Coverall  |  Lock Stitch  |  Ozlem T.  |  540  |  
|  Back Seam  |  Lock Stitch  |  Nahide K.  |  433,5  |  
|  Inside Seam  |  Lock Stitch  |  Nahide K.  |  33  |  
|  Inside Seam  |  Lock Stitch  |  Sevil K.  |  540  |  
|  10  |  Hem Coverstitch  |  Flatlock  |  Seyhan A.  |  540  |  
|  11  |  Hem Coverstitch  |  Flatlock  |  Son ay H.  |  381  |  
|  22  |  Eiastic Ironing  |  Ironing Board  |  Ceyda K.  |  225  |  
|  12  |  Elasctic Cutting  |  Manual  |  Ceyda K.  |  70,5  |  
|  13  |  Elastic Cutting  |  Manual  |  IVIelek C.  |  540  |  
|  12  |  i Elastic Joining  |  Bartack  |  Ceyda K.  |  87  |  
|  14  |  Elastic Joining  |  Bartack  |  Oziern K.  |  540  |  
|  15  |  Ela stiC Attach merit  |  Coverstitch  |  Ya5im T.  |  540  |  
|  16  |  Ela stir Attach merit  |  Coverstitch  |  Seda A.  |  336  |  
|  10  |  17  |  Elastic End Fastening  |  Bartack  |  IA elterre B.  |  486  |  
|  11  |  28  |  Thread Trimming  |  IVIanuai  |  Erdal T.  |  540  |  
|  11  |  19  |  Thread Trimming  |  Manual  |  Nebahat K.  |  195  |  
|  12  |  20  |  Ironing  |  ironing Board  |  Aslihan K.  |  540  |  
|  12  |  21  |  Ironing  |  Ironing Board  |  Zeki b.  |  444  |  
|  13  |  22  |  Quality Control  |  Manual  |  Hillya Y.  |  540  |  
|  13  |  23  |  Quality Control  |  Manual  |  Kadriye A.  |  493,5  |  
**Table 2** Results of digital line-balancing for 5210 boxer short
The workload distribution for each workstation can be analyzed using the cumulative chart presented in [Figure 8](https://medcraveonline.com/JTEFT/the-role-of-process-monitoring-devices-and-digital-line-balancing-in-achieving-operational-excellence-in-garment-manufacturing.html#fig8).
**Figure 8** Yamazumi chart in the digital line balancing program.
[Table 3](https://medcraveonline.com/JTEFT/the-role-of-process-monitoring-devices-and-digital-line-balancing-in-achieving-operational-excellence-in-garment-manufacturing.html#tab3) provides a detailed comparison of key performance metrics, illustrating the effects of the optimization algorithm on production efficiency. It outlines the metrics analyzed, including production output, line efficiency, and workforce utilization, highlighting the notable improvements observed post-implementation. The data presented underscores the effectiveness of the optimization strategy in enhancing operational performance without increasing working hours or overwhelming resources.  
|  **Operational metric**  |  **Before optimization**  |  **After optimization**  |  **Difference**  |  **Percentage change**  |  
| --- | --- | --- | --- | --- |  
|  Daily Production Quantity  |  768 pieces  |  1500 pieces  |  +732 pieces  |  +95.31%  |  
|  Daily Working Time  |  540 min  |  540 min  |  
|  Total Actual Standard Time  |  7.39 min  |  7.39 min  |  
|  Line Efficiency  |  70.08%  |  89.25%  |  19.17%  |  27.35%  |  
|  Number of Current Operators  |  15 employees  |  23 employees  |  +8 people  |  +53.33%  |  
|  Labour Productivity  |  51 pieces  |  65 pieces  |  +14 pieces  |  +27.45%  |  
**Table 3** Comparison of performance metrics before and after optimization
This study's findings underscore the substantial efficiency gains achievable through algorithmic optimization of production lines. The implementation of the optimization algorithm yielded a significant increase in overall line efficiency, measured as a 27.35% improvement compared to traditional, non-optimized methods. This enhancement can be attributed to the algorithm's capacity to effectively distribute workloads across the production line, leading to improved operator performance, more efficient resource utilization, and a smoother, more balanced workflow.
Furthermore, the optimization strategy resulted in a notable 27.45% increase in per-operator production output, highlighting the positive impact of efficient workload management on individual productivity. This translated to an increase from 51 units to 65 units produced per operator, demonstrating that optimized task allocation enables individual operators to contribute more effectively to the overall production process.
Beyond individual operator gains, the digital algorithm demonstrated its capacity for dynamic resource allocation by calculating the minimum number of operators required to meet fluctuating production demands. In the current scenario, achieving a daily production target of 1,500 units necessitated the algorithm's recommendation to increase the operator count from 15 to 23, with corresponding task assignments generated to maintain a balanced workflow. This adaptability is essential for sustaining efficiency in dynamic production environments characterized by variable demand.
#  Conclusion
The implementation of Process Monitoring Devices (PMDs) as a shop floor control technology presents manufacturers with a significant opportunity to optimize production processes.12 However, to fully leverage these advancements, it is crucial to consider the broader operational context and the interrelationships between processes. When paired with Lean manufacturing principles, digitalization fosters innovation and enhances operational efficiency.
Implementing digital lean management can lead to substantial productivity gains and cost reductions, ranging from 10% to 30%, depending on operational conditions. Real-time process monitoring, a key component of digital lean management, provides management with critical data that enables proactive risk assessment and informed decision-making. By incorporating operators' skills and performance metrics, organizations can automate task assignments, thereby maximizing sewing line efficiency.
Digital line balancing algorithms, enhanced by user-friendly software that integrates smoothly with existing practices and ERP systems, improve production coordination by offering real-time data for necessary adjustments. This increased visibility supports better decision-making and allows for quick responses to operational issues. Lean-based software algorithms specifically designed for sewing line optimization help reduce time losses during model changes and consider how different operations are connected, boosting overall performance in the labor-intensive apparel sector. Continuous monitoring and adjustments are essential for maintaining efficiency; by identifying and addressing bottlenecks, organizations can ensure a smooth workflow. Moreover, simulation applications can help refine processes and maintain a consistent flow of work.
As the apparel industry increasingly embraces digitalization, adopting optimization tools like digital line balancing algorithms has become crucial for enhancing operational efficiency and maintaining a competitive edge. These algorithms outperform traditional methods by leveraging computational power and data analysis to optimize resource allocation and workflow, ultimately maximizing efficiency and minimizing waste.
In summary, adopting lean digitalization and sewing line balancing strategies equips apparel businesses to enhance their competitiveness. The capacity to rapidly adapt to shifting demands, coupled with a commitment to operational excellence, is vital for thriving in today’s dynamic market. These strategies not only boost efficiency but also establish a foundation for continuous improvement and innovation, ensuring that apparel businesses remain agile and adaptable.
# Acknowledgments
The authors gratefully acknowledge the financial support provided by the Istanbul Technical University Scientific Research Project Unit under project MDK-2022-44123. We extend our sincere appreciation to ITM Tech Soft Company for their invaluable support and for providing the essential facilities that made this research possible.
# Funding 
None.
# Conflicts of interest 
The author declares that there is no conflict of interest.
# References
  1. [Bheda R, Narag A, Singla ML. Apparel manufacturing: a strategy for productivity improvement. _Journal of Fashion Marketing and Management_. 2003;7(1):12-22.](https://www.emerald.com/insight/content/doi/10.1108/13612020310464331/full/html)
  2. [Hasan M, Shanta MR, Shams AA, et al. Advantages of lean techniques application in apparel industry: case study on knit jacket. _J Textile Eng Fashion Technol._ 2019;5(5).](https://medcraveonline.com/JTEFT/advantages-of-lean-techniques-application-in-apparel-industry-case-study-on-knit-jacket.html)
  3. [Azhar MN, Omar M, Ishak MSA. A case study of industry 4.0 adoption for the manufacturing SMEs in Malaysia – Are we ready?. _American Institute of Physics_. 2021.](https://pubs.aip.org/aip/acp/article-abstract/2339/1/020213/1028116/A-case-study-of-industry-4-0-adoption-for-the?redirectedFrom=fulltext)
  4. [Zambon I, Egidi G, Rinaldi F, et al. Applied research towards industry 4.0: opportunities for SMEs. _Multidisciplinary Digital Publishing Institute_. 2019;7(6):344-344.](https://www.mdpi.com/2227-9717/7/6/344)
  5. [Nascimento DLDM, Alencastro V, Quelhas OLG, et al. Exploring Industry 4.0 technologies to enable circular economy practices in a manufacturing context. _Journal of Manufacturing Technology Management_. 2018;30(3):607-627.](https://www.emerald.com/insight/content/doi/10.1108/JMTM-03-2018-0071/full/html)
  6. [Ferjani A, Ammar A, Pierreval H, et al. A simulation-optimization based heuristic for the online assignment of multi-skilled workers subjected to fatigue in manufacturing systems. _Computers & Industrial Engineering_. 2017;112:663-674.](https://www.sciencedirect.com/science/article/abs/pii/S0360835217300700?via%3Dihub)
  7. [Purtonen T, Kalliosaari A, Salminen A. Monitoring and Adaptive Control of Laser Processes. _Physics Procedia_. 2014;56:1218-1231.](https://www.sciencedirect.com/science/article/pii/S1875389214001837?via%3Dihub)
  8. [Damanik IAV, Rumbara RD, Juhana N. Online monitoring for processes and condition of a machine using smart management card. _IOP Conference Series: Materials Science and Engineering_. 2020;980(1):012047-012047.](https://iopscience.iop.org/article/10.1088/1757-899X/980/1/012047)
  9. [Carvalho H, Rocha AM, Monteiro J, et al. Planning, control and monitoring tools for industrial garment assembly processes. _IEEE International Conference on Industrial Technology_. 2004.](https://ieeexplore.ieee.org/document/1290340)
  10. [Harikrishnan R, Rajeswaran M, Kumar S, et al. Productivity improvement in poly-cover packing line through line balancing and automation. Materialstodat: Proceedins. 2020;33:102-111.](https://www.sciencedirect.com/science/article/abs/pii/S2214785320320332?via%3Dihub)
  11. [Vanheusden S, Gils TV, Caris A, et al. Operational workload balancing in manual order picking. _Computers & Industrial Engineering_. 2020;141:106269-106269.](https://www.sciencedirect.com/science/article/abs/pii/S0360835220300036?via%3Dihub)
  12. [Kannan NS, Shyamkumar V, Kumar D, et al. Optimization of foundry process using lean principles. _American Institute of Physics_. 2020.](https://pubs.aip.org/aip/acp/article-abstract/2270/1/140002/723878/Optimization-of-foundry-process-using-lean?redirectedFrom=fulltext)
  13. [Prasetyawan Y, Suef M, Rifqy N, et al. Manufacturing strategy improvement based on lean methodology. _IOP Conference Series: Materials Science and Engineering_. 2019;508:012095-012095.](https://iopscience.iop.org/article/10.1088/1757-899X/508/1/012095)
  14. [Martinez-Condor B, Mamani-Motta F, Macassi-Jáuregui I, et al. Lean production model aligned with organizational culture to reduce order fulfillment issues in micro- and small-sized textile businesses in Peru. _IOP Conference Series: Materials Science and Engineering_. 2020;796(1):012016-012016.](https://iopscience.iop.org/article/10.1088/1757-899X/796/1/012016)
  15. Koç B. Dikim İşletmesinde Yalın Üretim ve Sürdürülebilir Yalın Dijital Model Tasarımı (Unpublished PhD thesis). Istanbul Technical University, Faculty of Textile Engineering. 2023.
  16. [Noor A, Saeed MA, Ullah T, et al. A review of artificial intelligence applications in apparel industry. _The Journal of The Textile Institute_. 2022;113(3):505-514.](https://www.tandfonline.com/doi/full/10.1080/00405000.2021.1880088)
  17. [Leu JF, Masri R. Omni-channel retailing and digital business: a case study in Malaysia. _Korean Distribution Science Association_. 2021;8(4):403-412.](http://koreascience.or.kr/article/JAKO202109554061384.page)


©2024 Koç, et al. This is an open access article distributed under the terms of the, which permits unrestricted use, distribution, and build upon your work non-commercially.
## Citations
[ 3 CITATIONS 3 Total citations 3 Recent citations 1.1 Field Citation Ratio n/a Relative Citation Ratio ](https://badge.dimensions.ai/details/doi/10.15406/jteft.2024.10.00386?domain=https://medcraveonline.com)
## Journal Menu
[
  * JTEFT Home](https://medcraveonline.com/JTEFT/index) [
  * Aims and Scope](https://medcraveonline.com/JTEFT/aims-and-scope) [
  * Editorial Board](https://medcraveonline.com/JTEFT/editorial-board) [
  * Reviewer Board](https://medcraveonline.com/JTEFT/reviewer-board) [
  * Articles In Press](https://medcraveonline.com/JTEFT/articles-in-press) [
  * Current Issue](https://medcraveonline.com/JTEFT/current-issue) [
  * Article Processing Fee](https://medcraveonline.com/JTEFT/processing-fee) [
  * Archive](https://medcraveonline.com/JTEFT/archive) [
  * Journal Contact](https://medcraveonline.com/JTEFT/journal-contact) 

## Useful Links
  * [Submit Manuscript](http://medcraveonline.com/submitmanuscript)
  * [Peer Review System](https://medcraveonline.com/peer-review-system.php)
  * [Terms & Conditions](http://medcraveonline.com/terms-conditions)
  * [Associate Editor Guidelines](http://medcraveonline.com/associate-editor-guidelines)
  * [Join as Associate Editor](http://medcraveonline.com/associateEditorRegistration)
  * [Reviewer Guidelines](https://medcraveonline.com/reviewer-review_policies)
  * Downloads 
    * [Cover Letter-Manuscript Submission](http://medcraveonline.com/pdf/Manuscript-Cover-Letter-MedCrave.docx)
    * [Template-Manuscript Submission](http://medcraveonline.com/pdf/Manuscript%20Template%20submission.docx)


[Tweets by medcraveonline](https://twitter.com/medcraveonline?ref_src=twsrc%5Etfw)
Texto original
Avalie a tradução
O feedback vai ser usado para ajudar a melhorar o Google Tradutor
