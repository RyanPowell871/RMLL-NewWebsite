import { ExternalLink } from 'lucide-react';
import floorDiagramRMLL from "figma:asset/7525a496c2e88d72bba436ed3c0ab830b07c9c58.png";
import floorDiagramCLA from "figma:asset/3de3b728b13433a6d66432daec883ad9a1e7ebe0.png";
import netFront1 from "figma:asset/373d80c90f371ec3b6da24d2c25cc011d7b7b897.png";
import netBack from "figma:asset/59bf06c097ec7547b95adb28a58dd9a6c4aa678f.png";
import netCornerDetail from "figma:asset/8f46ae4ff875ed65b7071d58869f8759db448f86.png";
import netMeshFloorContact from "figma:asset/9c61f0d1f2797245057c731f7e9a33605302080c.png";
import netSideSlack from "figma:asset/2261fb2525a5170ae6511f8bd13c46ccc38f7844.png";
import netSideView from "figma:asset/ed6c4fe14fe2d403367ca9fc944fc8d58e1b88ec.png";
import netFront2 from "figma:asset/af1bd6b987d8d9eadc3dba6976c3900dc75017fe.png";
import netCornerMesh from "figma:asset/424f4feb4302c62fed180230ec87b439d553d9ec.png";
import netTopCorner from "figma:asset/650a3bb2089df026b1c81272dfa0aabdb5e1ed57.png";
import netSideProfile from "figma:asset/101928d46b4c245f085961612efe6d35d05bc0b9.png";

export function OfficiatingFloorEquipmentPage() {
  return (
    <div>
      <h2>Floor Diagram & Line Markings</h2>
      <p>
        The following diagrams illustrate the official floor layout and line markings for box lacrosse play
        as specified by the CLA. The first diagram shows the markings specific to <strong>2024 RMLL Play</strong>,
        and the second shows the standard <strong>CLA Play</strong> markings.
      </p>

      <div className="not-prose my-6 space-y-6">
        {/* RMLL Floor Diagram */}
        <div className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white overflow-hidden">
          <div className="bg-gradient-to-r from-[#013fac] to-[#0149c9] text-white px-4 py-2 border-b-2 border-black">
            <h3 className="text-sm font-bold tracking-wide m-0">FLOOR DIAGRAM — 2024 RMLL PLAY</h3>
          </div>
          <div className="p-4 flex justify-center bg-gray-50">
            <img
              src={floorDiagramRMLL}
              alt="Floor Diagram and Line Markings for 2024 RMLL Play"
              className="max-w-full h-auto"
            />
          </div>
        </div>

        {/* CLA Floor Diagram */}
        <div className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white overflow-hidden">
          <div className="bg-gradient-to-r from-[#013fac] to-[#0149c9] text-white px-4 py-2 border-b-2 border-black">
            <h3 className="text-sm font-bold tracking-wide m-0">FLOOR DIAGRAM — CLA PLAY</h3>
          </div>
          <div className="p-4 flex justify-center bg-gray-50 overflow-hidden">
            <div className="w-full" style={{ paddingBottom: '70%', position: 'relative' }}>
              <img
                src={floorDiagramCLA}
                alt="Floor Diagram and Line Markings for CLA Play"
                className="absolute top-1/2 left-1/2 h-full"
                style={{ transform: 'translate(-50%, -50%) rotate(90deg)' }}
              />
            </div>
          </div>
        </div>
      </div>

      <h2>Major Nets (Frames & Mesh)</h2>

      <h3>Frame Size</h3>
      <p>
        <strong>4' × 4'6"</strong>
      </p>

      <h3>CLA Net Standards</h3>
      <p>
        As per the CLA, effective January 1, 2013, all box lacrosse nets in Canada must meet the
        Canadian Lacrosse Association (CLA) approved net specification standards and be manufactured
        by one of an approved list of CLA net manufacturers. See the{' '}
        <a href="https://lacrosse.ca" target="_blank" rel="noopener noreferrer">
          CLA website
        </a>{' '}
        for details.
      </p>

      <h3>Mesh Colour</h3>
      <p>
        In 2015, the RMLL passed a Regulation that all Major nets were to be strung with{' '}
        <strong>black mesh</strong>. When mesh needed to be replaced, it was to be replaced with
        black mesh, so all nets should now have black mesh. The white mesh made for situations where
        Officials may have lost sight of the ball, resulting in missed goals.
      </p>

      <h3>Maintenance of Mesh</h3>
      <p>
        It is the <strong>Home team's responsibility</strong> to ensure the mesh on their nets is in
        good shape, including after warm-ups, prior to the Officials taking the floor. Although the
        black mesh is stronger than the white mesh, the black mesh will also develop holes as time
        goes on.
      </p>
      <ul>
        <li>Holes in the mesh can be repaired with <strong>shoe laces or string</strong>.</li>
        <li>
          <strong>Do not use any kind of wire</strong> to fix a hole, or use wire to string the mesh
          to the goalposts.
        </li>
      </ul>

      <h3>Replacement of Mesh</h3>
      <p>
        Replacement depends on how much the nets are used. When too many holes develop, the mesh must
        be replaced.
      </p>

      <h3>Suppliers for Mesh</h3>
      <p>
        One supplier for black mesh for 4' × 4'6" frames is:
      </p>

      <div className="not-prose my-4">
        <div className="bg-blue-50 border-2 border-[#013fac] rounded-lg p-4">
          <p className="font-bold text-gray-900 text-sm">Big Hill Services</p>
          <p className="text-sm text-gray-700">Cochrane, Alberta</p>
          <p className="text-sm text-gray-700">
            Phone: <a href="tel:1-888-932-2728" className="text-[#013fac] font-semibold hover:underline">1-888-932-2728</a>
          </p>
          <p className="text-xs text-gray-500 mt-2 italic">
            When ordering new mesh, make sure mesh is being ordered for 4' × 4'6" frames.
          </p>
        </div>
      </div>

      <h3>Cost Responsibility</h3>
      <ul>
        <li>If a <strong>team owns</strong> the Major nets, then they are responsible for the cost.</li>
        <li>
          If the <strong>arena owns</strong> the nets, then just ask the arena to order the black
          mesh as it would be their cost. Ensure it is communicated to the arena that the mesh is for{' '}
          <strong>4' × 4'6" frames</strong>.
        </li>
      </ul>

      <h3>Stringing of Mesh</h3>
      <p>
        The mesh is <strong>not to be drawn taut</strong>.
      </p>
      <blockquote>
        <p>
          <strong>CLA Box Lacrosse Rule 8(a) — page 19:</strong> The mesh must have sufficient slack.
          If the mesh is the correct size for a 4' × 4'6" frame there will be a lot of slack, which
          is correct.
        </p>
      </blockquote>
      <p>
        The mesh should be touching the floor due to the slack — this contact is a good guide for
        proper stringing. <strong>More slack is always better than less.</strong>
      </p>

      {/* Net Reference Photos */}
      <div className="not-prose my-8">
        <div className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white overflow-hidden">
          <div className="bg-gradient-to-r from-[#013fac] to-[#0149c9] text-white px-4 py-2 border-b-2 border-black">
            <h3 className="text-sm font-bold tracking-wide m-0">REFERENCE PHOTOS — PROPERLY STRUNG 4' x 4'6" NET</h3>
          </div>
          <div className="p-4 bg-gray-50">
            <p className="text-sm text-gray-600 mb-4">
              The following photos show what a 4' x 4'6" frame with correctly strung black mesh should look like.
              Note how the mesh is touching the floor due to the slack — this contact is a good guide for proper stringing.
            </p>

            {/* Full-width front views */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                <img src={netFront1} alt="Front view of properly strung 4x4'6 net showing black mesh with correct slack" className="w-full h-auto" />
                <div className="px-3 py-2 bg-gray-100 border-t border-gray-200">
                  <p className="text-xs font-semibold text-gray-700">Front View</p>
                  <p className="text-xs text-gray-500">Black mesh with proper slack visible at bottom</p>
                </div>
              </div>
              <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                <img src={netFront2} alt="Front view of second net showing correct mesh slack" className="w-full h-auto" />
                <div className="px-3 py-2 bg-gray-100 border-t border-gray-200">
                  <p className="text-xs font-semibold text-gray-700">Front View (Alternate)</p>
                  <p className="text-xs text-gray-500">Mesh touching floor indicates correct slack</p>
                </div>
              </div>
            </div>

            {/* Side and back views */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                <img src={netBack} alt="Back view of net showing mesh depth and slack" className="w-full h-auto" />
                <div className="px-3 py-2 bg-gray-100 border-t border-gray-200">
                  <p className="text-xs font-semibold text-gray-700">Back View</p>
                  <p className="text-xs text-gray-500">Mesh hangs with natural slack from back of frame</p>
                </div>
              </div>
              <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                <img src={netSideView} alt="Side view of net showing proper mesh depth" className="w-full h-auto" />
                <div className="px-3 py-2 bg-gray-100 border-t border-gray-200">
                  <p className="text-xs font-semibold text-gray-700">Side View</p>
                  <p className="text-xs text-gray-500">Shows proper depth of mesh when correctly strung</p>
                </div>
              </div>
            </div>

            {/* Slack and floor contact details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                <img src={netSideSlack} alt="Side angle showing mesh touching the floor" className="w-full h-auto" />
                <div className="px-3 py-2 bg-gray-100 border-t border-gray-200">
                  <p className="text-xs font-semibold text-gray-700">Mesh Floor Contact</p>
                  <p className="text-xs text-gray-500">Mesh touching the floor — key indicator of correct slack</p>
                </div>
              </div>
              <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                <img src={netSideProfile} alt="Side profile showing mesh depth from frame" className="w-full h-auto" />
                <div className="px-3 py-2 bg-gray-100 border-t border-gray-200">
                  <p className="text-xs font-semibold text-gray-700">Side Profile</p>
                  <p className="text-xs text-gray-500">Full side profile showing mesh depth and slack</p>
                </div>
              </div>
            </div>

            {/* Detail close-ups */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                <img src={netMeshFloorContact} alt="Close-up of mesh contacting the floor at bottom corner" className="w-full h-auto" />
                <div className="px-2 py-1.5 bg-gray-100 border-t border-gray-200">
                  <p className="text-[10px] font-semibold text-gray-700">Bottom Corner Slack</p>
                </div>
              </div>
              <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                <img src={netCornerDetail} alt="Close-up of mesh attachment at bottom corner of frame" className="w-full h-auto" />
                <div className="px-2 py-1.5 bg-gray-100 border-t border-gray-200">
                  <p className="text-[10px] font-semibold text-gray-700">Corner Attachment</p>
                </div>
              </div>
              <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                <img src={netCornerMesh} alt="Close-up of mesh tied to corner post" className="w-full h-auto" />
                <div className="px-2 py-1.5 bg-gray-100 border-t border-gray-200">
                  <p className="text-[10px] font-semibold text-gray-700">Post Mesh Detail</p>
                </div>
              </div>
              <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                <img src={netTopCorner} alt="Close-up of mesh tied at top corner of frame" className="w-full h-auto" />
                <div className="px-2 py-1.5 bg-gray-100 border-t border-gray-200">
                  <p className="text-[10px] font-semibold text-gray-700">Top Corner Tie</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}