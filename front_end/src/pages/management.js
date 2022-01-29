import React, { useState, useEffect, useContext } from "react";
import ReactPaginate from 'react-paginate';
import "../static/css/management.css";
import { toggleSearch, toggleFilter } from "../static/js/utils.js";
import ProfileModal from "../components/add_organisation.js";
import PopUp from "../components/pop_up.js";
import Loading from "../components/loading.js";
import DefaultProfile from "../static/media/images/default-profile.jpg";
import SearchIcon from "../static/media/icons/search.svg";
import PlusIcon from "../static/media/icons/plus.svg";
import ArrowIcon from "../static/media/icons/arrow.svg";
import TickIcon from "../static/media/icons/tick.svg";
import CrossIcon from "../static/media/icons/cross.svg";
import { host, api } from "../static/js/config.js";
import { TokenContext, IdentityContext } from '../context.js';
import AddOrganisation from "../components/add_organisation.js";
// import EditOrganisation from "../components/edit_organisation.js";
import AddAccount from "../components/add_account.js";

export default function Management() {
    // const [ownOrganisation, setOwnOrganisation] = useState(false);
    const [organisationNameTitle, setOrganisationNameTitle] = useState("");
    const [organisationID, setOrganisationID] = useState(null);
    const [addOption, setAddOption] = useState(true);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [pageNumber, setPageNumber] = useState(0);
    const [pageCount, setPageCount] = useState(0);
    const [organisationPageNumber, setOrganisationPageNumber] = useState(0);
    const [accountPageNumber, setAccountPageNumber] = useState(0);
    const [organisationPageCount, setOrganisationPageCount] = useState(0);
    const [accountPageCount, setAccountPageCount] = useState(0);
    const token = useContext(TokenContext);
    const identity = useContext(IdentityContext);
    const [organisations, setOrganisations] = useState(null);
    const [accounts, setAccounts] = useState();
    const [addOrganisationModal, setAddOrganisationModal] = useState(false);
    const [editOrganisationModal, setEditOrganisationModal] = useState(false);
    const [addAccountModal, setAddAccountModal] = useState(false);
    const [chosenOrganisation, setChosenOrganisation] = useState(null);

    const loadOrganisations = () => {
        let url = `${api}/organisations`;
        fetch(url, {
            method: 'POST',
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token,
            },
            body: JSON.stringify({
                search: search,
                page_number: organisationPageNumber,
            })
        })
        .then(response => response.json())
        .then(result => {
            setOrganisations(result);
            setLoading(false);
            if (result[0]) {
                // setOrganisationPageCount(result[0].page_count);
                setPageCount(result[0].page_count);
            } else {
                setPageCount(1);
                setPageNumber(0);
                // setOrganisationPageCount(1)
                setOrganisationPageNumber(0);
            }

            // if (accounts) {
            //     result.some(item => {
            //         if (organisationID === item.id) {
            //             setOrganisationNameTitle(item.name); 
            //             setChosenOrganisation(item);
            //         }
            //         return null;
            //     }
            //     );
            // }
            // const tempRoles = ["cyberbully", "cybervictim"];
            // console.log(result)
        });
    }

    useEffect(() => {
        document.querySelector(".management__content").addEventListener("click", toggleSearch);

        // identity.organisation_type === "government" ? loadOrganisations() : loadAccounts();
        loadOrganisation();

        return () => {
            document.removeEventListener("click", toggleSearch)
        }
    }, []);

    useEffect(() => {
        // accounts ? loadAccounts() : loadOrganisations();
        loadOrganisations();
    }, [search, pageNumber]);

    // const viewAccounts = organisation => {
    //     setLoading(true);
    //     setOrganisationID(organisation.id);
    //     setOrganisationNameTitle(organisation.name)
    //     setSearch("");
    //     loadAccounts(organisation.id);
    //     setChosenOrganisation(organisation);
    // }    

    const loadOrganisation = () => {
        let url = `${api}/organisation`;
        fetch(url, {
            method: 'POST',
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token,
            },
            body: JSON.stringify({
                organisation_id: identity.organisation_id,
            })
        })
        .then(response => response.json())
        .then(result => {
            setChosenOrganisation(result);
            // const tempRoles = ["cyberbully", "cybervictim"];
            // console.log(result)
        });
    }

    return (
        <div className="management__content">
            <div className="management__header">
                <h2>Management - Organisations</h2>
                <div className="filter">
                    <div className="filter__search">
                        <img src={SearchIcon} id="searchIcon" alt="search icon" className="search__icon" />
                        <input placeholder="Search" id="searchInput" type="text" value={search} onChange={event => setSearch(event.target.value)} />
                    </div>
                </div>
            </div>
            <div className="managements__outline">
                {!loading ? <div className="managements">
                    {organisations.map(organisation => 
                    <div className="management__flip">
                        <div className="management__flip--inner">
                            <div className="management management__flip--front">
                                <div>
                                    <img src={organisation.image ? `${host}/static/media/images/${organisation.image}` : DefaultProfile} alt="organisation icon" />
                                </div>
                                <div>
                                    <p>{organisation.name}</p>
                                    <p>{organisation.type}</p>
                                </div>
                            </div>
                            <div className="management__flip--back">
                                <p>{organisation.phone_number}</p>
                                <p>{organisation.email_address}</p>
                            </div>
                        </div>
                    </div>
                    )}
                    {addOption && <div className="management management--add">
                        <div>
                            <img src={DefaultProfile} alt="add icon" />
                        </div>
                        <div>
                            <p>{"Organisation Name"}</p>
                        </div>
                        <button className="button" onClick={() => setAddOrganisationModal(true)}>Add Organisation</button>
                    </div>}
                </div>
                : <div className="management--loading">
                    <Loading />
                </div>}
                <div className="managements__actions">
                    {/* {accounts && identity.organisation_type === "government" && <button className="button" onClick={() => {setAccounts(null); setAddOption(true); setOrganisationNameTitle(""); setSearch("")}}>Back</button>} */}
                    <ReactPaginate
                        // pageCount={accounts ? accountPageCount : organisationPageCount}
                        pageCount={pageCount}
                        pageRangeDisplayed={2}
                        marginPagesDisplayed={1}
                        forcePage={pageNumber}
                        initialPage={pageNumber}
                        // forcePage={accounts ? accountPageNumber : organisationPageNumber}
                        // initialPage={accounts ? accountPageNumber : organisationPageNumber}
                        onPageChange={event => setPageNumber(event.selected)}
                        activeClassName="pagination__link--active"
                        containerClassName="pagination__container" 
                    />
                    {/* {accounts && addOption && <button className="button edit__organisation__button" onClick={() => setEditOrganisationModal(true)}>Edit Organisation</button>} */}
                </div>
            </div>
            {addOrganisationModal && <AddOrganisation setAddOrganisationModal={setAddOrganisationModal} loadData={loadOrganisations} />}
            {/* {editOrganisationModal && <EditOrganisation setEditOrganisationModal={setEditOrganisationModal} tempOrganisation={chosenOrganisation} loadData={identity.organisation_type === "government" ? loadOrganisations : loadOrganisation} />} */}
            {/* {addAccountModal && <AddAccount organisationID={organisationID || identity.organisation_id} setAddAccountModal={setAddAccountModal} loadData={loadAccounts} />} */}
        </div>
    );
}