package pe.edu.utec.vetcare.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import pe.edu.utec.vetcare.dto.request.CreateCitaRequest;
import pe.edu.utec.vetcare.dto.request.UpdateCitaRequest;
import pe.edu.utec.vetcare.dto.response.CitaResponse;
import pe.edu.utec.vetcare.entity.CitaEntity;

@Mapper(componentModel = "spring")
public interface CitaMapper {

    @Mapping(target = "idCita", ignore = true)
    @Mapping(target = "veterinario", ignore = true)
    @Mapping(target = "mascota", ignore = true)
    @Mapping(target = "estado", ignore = true)
    CitaEntity toEntity(CreateCitaRequest request);

    @Mapping(
            source = "veterinario.idVeterinario",
            target = "idVeterinario"
    )
    @Mapping(
            source = "mascota.idMascota",
            target = "idMascota"
    )
    CitaResponse toResponse(CitaEntity entity);

    @Mapping(target = "idCita", ignore = true)
    @Mapping(target = "veterinario", ignore = true)
    @Mapping(target = "mascota", ignore = true)
    @Mapping(target = "estado", ignore = true)
    void updateEntity(
            UpdateCitaRequest request,
            @MappingTarget CitaEntity entity
    );
}