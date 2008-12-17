class ExternalPageFunctions : implements IDocHostUIHandler, IDispatch
{
	STDMETHOD(GetExternal)(IDispatch** ppDispatch)
	{
		*ppDispatch = (IDispatch*)this;
		(*ppDispatch)->AddRef();

		return S_OK;
	}
};